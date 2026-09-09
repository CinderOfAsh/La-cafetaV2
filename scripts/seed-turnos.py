#!/usr/bin/env python3
"""
Script de generación de turnos para La Cafeta V2.

Sistema:
- 8 parejas rotando
- Cada semana la pareja N avanza al turno N+1 (la del turno 8 siempre es P0)
- 5 tipos de turnos (Mañana LMX, Tarde LMX, Mediodia X, Tarde X, Mediodia V)
- Roles alternados: si la pareja cubre 2 turnos en la semana, los invierte

Salidas:
- Genera /tmp/turnos.sql con INSERTs para User, Shift y ShiftAssignment
- Pensado para correr contra la BD del standalone en Hostinger

Uso:
    python3 scripts/seed-turnos.py > /tmp/turnos.sql
    scp /tmp/turnos.sql usuario@host:/tmp/
    ssh usuario@host "sqlite3 /path/to/dev.db < /tmp/turnos.sql"
"""

import os
from datetime import date, timedelta

# 8 parejas en orden
PAREJAS = [
    ("BAKR", "HUGO"),
    ("CLAUDIA", "DIEGO V"),
    ("JAVIER G", "ANGEL"),
    ("ADRIÁN", "JAVIER D"),
    ("AITANA", "VITTORIO"),
    ("JOSÉ G", "DIEGO S"),
    ("LUCA", "KAWTAR"),
    ("SOFÍA", "ELÍAS"),
]

# Map de nombre_display -> (username, email)
# Emails del dominio alumni.mondragon.edu
USUARIOS = {
    "BAKR":      ("Bakr",     "mohammadbakr.ouahid@alumni.mondragon.edu"),
    "HUGO":      ("Hugo",     "hugonicholas.abrey@alumni.mondragon.edu"),
    "CLAUDIA":   ("Claudia",  "claudia.gordo@alumni.mondragon.edu"),
    "DIEGO V":   ("Diego V",  "diego.villasante@alumni.mondragon.edu"),
    # Javi G = Javi M en BD; Javi D = Javi C en BD (Bakr lo renombró)
    "JAVIER G":  ("Javi M",   "franciscojavier.garg@alumni.mondragon.edu"),
    "ANGEL":     ("Angel",    "angel.rodriguez@alumni.mondragon.edu"),
    "ADRIÁN":    ("Adrian",   "adrian.navarro@alumni.mondragon.edu"),
    "JAVIER D":  ("Javi C",   "javier.diazn@alumni.mondragon.edu"),
    "AITANA":    ("Aitana",   "aitana.gonzalez@alumni.mondragon.edu"),
    "VITTORIO":  ("Vittorio", "vittorioniccola.camp@alumni.mondragon.edu"),
    "JOSÉ G":    ("Jose G",   "josefrancisco.gomez@alumni.mondragon.edu"),
    "DIEGO S":   ("Diego S",  "diego.sanchezg@alumni.mondragon.edu"),
    "LUCA":      ("Luca",     "luca.rodriguez@alumni.mondragon.edu"),
    "KAWTAR":    ("Kawtar",   "kawtar.mellass@alumni.mondragon.edu"),
    "SOFÍA":     ("Sofía",    "sofia.villabrille@alumni.mondragon.edu"),
    "ELÍAS":     ("Elias",    "eliasbenjamin.vicen@alumni.mondragon.edu"),
}

# Bakr es ADMIN (passwd 0009); el resto EMPLOYEE (passwd vacía)
ADMIN_EMAIL = "mohammadbakr.ouahid@alumni.mondragon.edu"
ADMIN_PASSWORD = "0009"

# 5 tipos de Shift
SHIFTS = [
    ("shift_manana_lmx",  "Mañana LMX", "08:45", "13:00", "1,2,4"),
    ("shift_tarde_lmx",   "Tarde LMX",  "13:00", "17:00", "1,2,4"),
    ("shift_mediodia_x",  "Mediodía X", "12:00", "14:00", "3"),
    ("shift_tarde_x",     "Tarde X",    "14:00", "17:00", "3"),
    ("shift_mediodia_v",  "Mediodía V", "12:00", "14:00", "5"),
]

# Bakr dijo que los turnos van desde el 7 sept hasta la primera semana de octubre
# = 5 semanas (7 sept, 14 sept, 21 sept, 28 sept, 5 oct) -> cierra viernes 9 oct
START_MONDAY = date(2026, 9, 7)
WEEKS = 5

# Generar SQL
out = []
out.append("-- Limpiar turnos y usuarios previos (mantener productos/raw materials)")
out.append("DELETE FROM ShiftAssignment;")
out.append("DELETE FROM Shift;")
out.append("DELETE FROM User WHERE email LIKE '%@alumni.mondragon.edu' OR email LIKE '%@lacafeta.com';")
out.append("")

# Insertar usuarios
out.append("-- Usuarios")
for p_idx, pareja in enumerate(PAREJAS):
    for persona in pareja:
        name_disp, email = USUARIOS[persona]
        if email == ADMIN_EMAIL:
            role = "ADMIN"
            pwd = ADMIN_PASSWORD
        else:
            role = "EMPLOYEE"
            pwd = ""
        uid = "cuid_" + email.replace("@", "_").replace(".", "_")
        out.append(
            f"INSERT INTO User (id, name, email, password, role, isActive, customFields, createdAt, updatedAt) "
            f"VALUES ('{uid}', '{name_disp}', '{email}', '{pwd}', '{role}', 1, '{{}}', datetime('now'), datetime('now'));"
        )

# Insertar shifts
out.append("")
out.append("-- Shifts")
for shift_id, name, start, end, days in SHIFTS:
    out.append(
        f"INSERT INTO Shift (id, name, startTime, endTime, daysOfWeek, openingProtocol, closingProtocol, createdAt, updatedAt) "
        f"VALUES ('{shift_id}', '{name}', '{start}', '{end}', '{days}', '[]', '[]', datetime('now'), datetime('now'));"
    )

# Generar asignaciones
shift_to_id = {s[1]: s[0] for s in SHIFTS}
out.append("")
out.append("-- ShiftAssignments")

idx = 0
for week in range(WEEKS):
    lunes = START_MONDAY + timedelta(weeks=week)
    viernes = lunes + timedelta(days=4)

    # 9 turnos de la semana (Lun/Mar/Jue mañana+tarde, Mié mediodía+tarde, Vie mediodía)
    turnos_semana = [
        (lunes,                   "Mañana LMX"),
        (lunes,                   "Tarde LMX"),
        (lunes + timedelta(days=1), "Mañana LMX"),
        (lunes + timedelta(days=1), "Tarde LMX"),
        (lunes + timedelta(days=2), "Mediodía X"),
        (lunes + timedelta(days=2), "Tarde X"),
        (lunes + timedelta(days=3), "Mañana LMX"),
        (lunes + timedelta(days=3), "Tarde LMX"),
        (viernes,                 "Mediodía V"),
    ]

    for p_idx in range(8):
        # Cada pareja en la semana W cubre el turno (P+W) mod 8
        t1_idx = (p_idx + week) % 8
        # La pareja P0 (siempre la del turno 0 en semana 0) cubre además el turno 8 (viernes)
        t_indices = [t1_idx, 8] if p_idx == 0 else [t1_idx]

        for t_idx in t_indices:
            fecha, tipo_turno = turnos_semana[t_idx]
            shift_id = shift_to_id[tipo_turno]

            # Roles: invertidos según el caso
            if t_idx == t1_idx:
                # Primer turno: roles normales (sem 0) o invertidos (otras sems)
                if week == 0:
                    rol1, rol2 = "COCINERO", "CAMARERO"
                else:
                    rol1, rol2 = "CAMARERO", "COCINERO"
            else:
                # Segundo turno (viernes) - invertido del primer turno
                # Si la pareja en la primera semana (W=0) hizo COCINERO en el primer turno,
                # en el segundo turno hace CAMARERO
                rol1, rol2 = "CAMARERO", "COCINERO"

            for persona, rol in zip(PAREJAS[p_idx], [rol1, rol2]):
                email = USUARIOS[persona][1]
                uid = "cuid_" + email.replace("@", "_").replace(".", "_")
                fecha_str = fecha.isoformat()
                out.append(
                    f"INSERT INTO ShiftAssignment (id, shiftId, userId, date, role, createdAt) "
                    f"VALUES ('sa_{idx}', '{shift_id}', '{uid}', '{fecha_str}', '{rol}', datetime('now'));"
                )
                idx += 1

out.append("")
out.append(f"-- Total: {idx} asignaciones en {WEEKS} semanas")

print('\n'.join(out))
