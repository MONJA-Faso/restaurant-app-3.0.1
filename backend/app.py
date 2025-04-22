from flask import Flask, jsonify, request, send_file
from flask_cors import CORS
import mysql.connector
from mysql.connector import Error
import datetime
from fpdf import FPDF
import os
import json

app = Flask(__name__)

# Configuration CORS plus permissive
CORS(app, resources={
    r"/*": {
        "origins": ["http://localhost:3000", "http://localhost:5173"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

# Ajoutez ceci pour gérer les requêtes OPTIONS (pré-vol)
@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', 'http://localhost:5173')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    response.headers.add('Access-Control-Allow-Credentials', 'true')
    return response

# Configuration pour XAMPP
db_config = {
    'host': 'localhost',
    'user': 'root',
    'password': '',
    'database': 'restaurant_db',
    'port': 3306
}

def create_db_connection():
    try:
        return mysql.connector.connect(**db_config)
    except Error as e:
        print(f"Erreur de connexion MySQL: {e}")
        return None

# ===== TABLES =====
@app.route('/tables', methods=['GET', 'POST'])
def handle_tables():
    conn = create_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500

    cursor = conn.cursor(dictionary=True)

    try:
        if request.method == 'GET':
            cursor.execute("SELECT * FROM restaurant_tables")
            tables = cursor.fetchall()
            
            # Ajout du statut de réservation
            for table in tables:
                cursor.execute("""
                    SELECT COUNT(*) as reservations 
                    FROM reserver 
                    WHERE idtable = %s 
                    AND date_de_reserv <= NOW() 
                    AND date_reserve >= NOW()
                """, (table['idtable'],))
                table['reservations'] = cursor.fetchone()['reservations']
            
            return jsonify(tables)

        elif request.method == 'POST':
            data = request.json
            cursor.execute(
                "INSERT INTO restaurant_tables (idtable, designation, occupation) VALUES (%s, %s, %s)",
                (data['idtable'], data['designation'], data.get('occupation', False))
            )
            conn.commit()
            return jsonify({'message': 'Table créée'}), 201

    except Error as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 400
    finally:
        cursor.close()
        conn.close()

@app.route('/tables/<idtable>', methods=['GET', 'PUT', 'DELETE'])
def manage_table(idtable):
    conn = create_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500

    cursor = conn.cursor(dictionary=True)

    try:
        if request.method == 'GET':
            cursor.execute("SELECT * FROM restaurant_tables WHERE idtable = %s", (idtable,))
            table = cursor.fetchone()
            if not table:
                return jsonify({'error': 'Table non trouvée'}), 404
            
            # Vérification des réservations
            cursor.execute("""
                SELECT * FROM reserver
                WHERE idtable = %s
                AND date_de_reserv <= NOW() 
                AND date_reserve >= NOW()
            """, (idtable,))
            table['reservations'] = cursor.fetchall()
            
            return jsonify(table)
            
        elif request.method == 'PUT':
            data = request.json
            cursor.execute(
                "UPDATE restaurant_tables SET designation = %s, occupation = %s WHERE idtable = %s",
                (data['designation'], data.get('occupation', False), idtable)
            )
            
            if cursor.rowcount == 0:
                return jsonify({'error': 'Table non trouvée'}), 404
                
            conn.commit()
            return jsonify({'message': f'Table {idtable} mise à jour'})
            
        elif request.method == 'DELETE':
            # Vérifier si la table existe
            cursor.execute("SELECT idtable FROM restaurant_tables WHERE idtable = %s", (idtable,))
            if not cursor.fetchone():
                return jsonify({'error': 'Table non trouvée'}), 404
            
            # Vérifier si la table est utilisée dans des commandes ou réservations
            cursor.execute("SELECT COUNT(*) as count FROM commande WHERE idtable = %s", (idtable,))
            if cursor.fetchone()['count'] > 0:
                return jsonify({'error': 'Impossible de supprimer: table référencée dans des commandes'}), 400
                
            cursor.execute("SELECT COUNT(*) as count FROM reserver WHERE idtable = %s", (idtable,))
            if cursor.fetchone()['count'] > 0:
                return jsonify({'error': 'Impossible de supprimer: table référencée dans des réservations'}), 400
            
            # Suppression
            cursor.execute("DELETE FROM restaurant_tables WHERE idtable = %s", (idtable,))
            conn.commit()
            return jsonify({'message': f'Table {idtable} supprimée'}), 200

    except Error as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/tables/liberer/<idtable>', methods=['PUT'])
def liberer_table(idtable):
    conn = create_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500

    cursor = conn.cursor(dictionary=True)

    try:
        # Vérifier si la table existe
        cursor.execute("SELECT occupation FROM restaurant_tables WHERE idtable = %s", (idtable,))
        table = cursor.fetchone()
        if not table:
            return jsonify({'error': 'Table non trouvée'}), 404
            
        # Libérer la table
        cursor.execute("UPDATE restaurant_tables SET occupation = FALSE WHERE idtable = %s", (idtable,))
        conn.commit()
        
        return jsonify({'message': f'Table {idtable} libérée'}), 200

    except Error as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

# ===== MENU =====
@app.route('/menu', methods=['GET', 'POST'])
def handle_menu():
    conn = create_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500

    cursor = conn.cursor(dictionary=True)

    try:
        if request.method == 'GET':
            search = request.args.get('search', '')
            if search:
                cursor.execute("SELECT * FROM menu WHERE nomplat LIKE %s", (f'%{search}%',))
            else:
                cursor.execute("SELECT * FROM menu")
            return jsonify(cursor.fetchall())

        elif request.method == 'POST':
            data = request.json
            cursor.execute(
                "INSERT INTO menu (idplat, nomplat, pu) VALUES (%s, %s, %s)",
                (data['idplat'], data['nomplat'], data['pu'])
            )
            conn.commit()
            return jsonify({'message': 'Plat ajouté au menu'}), 201

    except Error as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 400
    finally:
        cursor.close()
        conn.close()

@app.route('/menu/<idplat>', methods=['GET', 'PUT', 'DELETE'])
def manage_menu(idplat):
    conn = create_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500

    cursor = conn.cursor(dictionary=True)

    try:
        if request.method == 'GET':
            cursor.execute("SELECT * FROM menu WHERE idplat = %s", (idplat,))
            plat = cursor.fetchone()
            if not plat:
                return jsonify({'error': 'Plat non trouvé'}), 404
            return jsonify(plat)
            
        elif request.method == 'PUT':
            data = request.json
            cursor.execute(
                "UPDATE menu SET nomplat = %s, pu = %s WHERE idplat = %s",
                (data['nomplat'], data['pu'], idplat)
            )
            
            if cursor.rowcount == 0:
                return jsonify({'error': 'Plat non trouvé'}), 404
                
            conn.commit()
            return jsonify({'message': f'Plat {idplat} mis à jour'})
            
        elif request.method == 'DELETE':
            # Vérifier si le plat existe
            cursor.execute("SELECT idplat FROM menu WHERE idplat = %s", (idplat,))
            if not cursor.fetchone():
                return jsonify({'error': 'Plat non trouvé'}), 404
            
            # Vérifier si le plat est utilisé dans des commandes
            cursor.execute("SELECT COUNT(*) as count FROM commande_plats WHERE idplat = %s", (idplat,))
            if cursor.fetchone()['count'] > 0:
                return jsonify({'error': 'Impossible de supprimer: plat référencé dans des commandes'}), 400
            
            # Suppression
            cursor.execute("DELETE FROM menu WHERE idplat = %s", (idplat,))
            conn.commit()
            return jsonify({'message': f'Plat {idplat} supprimé'}), 200

    except Error as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

# ===== COMMANDES =====
@app.route('/commandes', methods=['GET', 'POST'])
def handle_commandes():
    conn = create_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500

    cursor = conn.cursor(dictionary=True)

    try:
        if request.method == 'GET':
            # Filtres par dates
            date_debut = request.args.get('date_debut')
            date_fin = request.args.get('date_fin')
            
            sql = """
                SELECT c.*, t.designation as table_designation
                FROM commande c
                LEFT JOIN restaurant_tables t ON c.idtable = t.idtable
            """
            params = []
            
            # Ajout des filtres de date
            if date_debut and date_fin:
                sql += " WHERE c.datecom BETWEEN %s AND %s"
                params.extend([date_debut, date_fin])
            elif date_debut:
                sql += " WHERE c.datecom = %s"
                params.append(date_debut)
                
            sql += " ORDER BY c.datecom DESC"
            
            cursor.execute(sql, params)
            commandes = cursor.fetchall()

            for commande in commandes:
                cursor.execute("""
                    SELECT cp.idplat, m.nomplat, cp.quantite, cp.prix_unitaire
                    FROM commande_plats cp
                    JOIN menu m ON cp.idplat = m.idplat
                    WHERE cp.idcom = %s
                """, (commande['idcom'],))
                commande['plats'] = cursor.fetchall()

            return jsonify(commandes)

        elif request.method == 'POST':
            data = request.json
            required = ['idcom', 'nomcli', 'typecom', 'plats']
            if not all(field in data for field in required):
                return jsonify({'error': 'Champs manquants'}), 400

            # Vérification de la table pour les commandes sur place
            if data['typecom'] == 'sur place':
                if 'idtable' not in data:
                    return jsonify({'error': 'Table requise pour commande sur place'}), 400
                
                # Vérifier si la table est disponible
                cursor.execute("SELECT occupation FROM restaurant_tables WHERE idtable = %s", (data['idtable'],))
                table = cursor.fetchone()
                if not table:
                    return jsonify({'error': 'Table introuvable'}), 404
                if table['occupation']:
                    return jsonify({'error': 'Table déjà occupée'}), 400
                
                # Vérifier si la table est réservée
                cursor.execute("""
                    SELECT COUNT(*) as reserved
                    FROM reserver
                    WHERE idtable = %s
                    AND NOW() BETWEEN date_de_reserv AND date_reserve
                    AND nomcli != %s
                """, (data['idtable'], data['nomcli']))
                
                if cursor.fetchone()['reserved'] > 0:
                    return jsonify({'error': 'Table réservée par un autre client'}), 400

            # Calcul du montant total
            montant_total = 0
            for plat in data['plats']:
                cursor.execute("SELECT pu FROM menu WHERE idplat = %s", (plat['idplat'],))
                prix = cursor.fetchone()
                if not prix:
                    return jsonify({'error': f'Plat {plat["idplat"]} introuvable'}), 404
                montant_total += prix['pu'] * plat.get('quantite', 1)

            # Création de la commande
            cursor.execute("""
                INSERT INTO commande 
                (idcom, nomcli, typecom, idtable, datecom, statut, montant_total)
                VALUES (%s, %s, %s, %s, %s, 'en attente', %s)
            """, (
                data['idcom'],
                data['nomcli'],
                data['typecom'],
                data.get('idtable'),
                data.get('datecom', datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')),
                montant_total
            ))

            # Ajout des plats
            for plat in data['plats']:
                cursor.execute("""
                    INSERT INTO commande_plats 
                    (idcom, idplat, quantite, prix_unitaire)
                    VALUES (%s, %s, %s, (SELECT pu FROM menu WHERE idplat = %s))
                """, (
                    data['idcom'],
                    plat['idplat'],
                    plat.get('quantite', 1),
                    plat['idplat']
                ))

            # Mise à jour de l'occupation de la table
            if data['typecom'] == 'sur place' and data.get('idtable'):
                cursor.execute("""
                    UPDATE restaurant_tables 
                    SET occupation = TRUE 
                    WHERE idtable = %s
                """, (data['idtable'],))

            conn.commit()
            return jsonify({'message': 'Commande créée avec succès'}), 201

    except Error as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/commandes/<idcom>', methods=['GET', 'PUT', 'DELETE'])
def manage_commande(idcom):
    conn = create_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500

    cursor = conn.cursor(dictionary=True)

    try:
        if request.method == 'GET':
            cursor.execute("""
                SELECT c.*, t.designation as table_designation
                FROM commande c
                LEFT JOIN restaurant_tables t ON c.idtable = t.idtable
                WHERE c.idcom = %s
            """, (idcom,))
            
            commande = cursor.fetchone()
            if not commande:
                return jsonify({'error': 'Commande non trouvée'}), 404
                
            cursor.execute("""
                SELECT cp.idplat, m.nomplat, cp.quantite, cp.prix_unitaire
                FROM commande_plats cp
                JOIN menu m ON cp.idplat = m.idplat
                WHERE cp.idcom = %s
            """, (idcom,))
            commande['plats'] = cursor.fetchall()
            
            return jsonify(commande)
            
        elif request.method == 'PUT':
            data = request.json
            
            # Récupérer l'ancienne commande pour vérifier si elle avait une table
            cursor.execute("SELECT idtable, typecom FROM commande WHERE idcom = %s", (idcom,))
            old_commande = cursor.fetchone()
            if not old_commande:
                return jsonify({'error': 'Commande non trouvée'}), 404
            
            # Mise à jour de la commande
            cursor.execute("""
                UPDATE commande
                SET nomcli = %s, typecom = %s, idtable = %s, statut = %s
                WHERE idcom = %s
            """, (
                data['nomcli'],
                data['typecom'],
                data.get('idtable'),
                data.get('statut', 'en attente'),
                idcom
            ))
            
            # Si la commande change de statut à "terminé", libérer la table
            if data.get('statut') == 'terminé' and old_commande['idtable']:
                cursor.execute("""
                    UPDATE restaurant_tables
                    SET occupation = FALSE
                    WHERE idtable = %s
                """, (old_commande['idtable'],))
            
            # Si la commande change de table ou passe de emporter à sur place
            if data['typecom'] == 'sur place' and data.get('idtable') != old_commande['idtable']:
                # Libérer l'ancienne table si elle existe
                if old_commande['idtable'] and old_commande['typecom'] == 'sur place':
                    cursor.execute("""
                        UPDATE restaurant_tables
                        SET occupation = FALSE
                        WHERE idtable = %s
                    """, (old_commande['idtable'],))
                
                # Occuper la nouvelle table
                if data.get('idtable'):
                    cursor.execute("""
                        UPDATE restaurant_tables
                        SET occupation = TRUE
                        WHERE idtable = %s
                    """, (data['idtable'],))
            
            conn.commit()
            return jsonify({'message': f'Commande {idcom} mise à jour'}), 200
            
        elif request.method == 'DELETE':
            # Vérifier si la commande existe
            cursor.execute("SELECT idtable, typecom FROM commande WHERE idcom = %s", (idcom,))
            commande = cursor.fetchone()
            if not commande:
                return jsonify({'error': 'Commande non trouvée'}), 404
            
            # Libérer la table si c'est une commande sur place
            if commande['idtable'] and commande['typecom'] == 'sur place':
                cursor.execute("""
                    UPDATE restaurant_tables
                    SET occupation = FALSE
                    WHERE idtable = %s
                """, (commande['idtable'],))
            
            # Supprimer les plats de la commande
            cursor.execute("DELETE FROM commande_plats WHERE idcom = %s", (idcom,))
            
            # Supprimer la commande
            cursor.execute("DELETE FROM commande WHERE idcom = %s", (idcom,))
            
            conn.commit()
            return jsonify({'message': f'Commande {idcom} supprimée'}), 200

    except Error as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/commandes/client/<nomcli>', methods=['GET'])
def get_commandes_client(nomcli):
    conn = create_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500

    cursor = conn.cursor(dictionary=True)

    try:
        # Recherche exacte ou partielle selon le paramètre
        search_type = request.args.get('search_type', 'exact')
        
        if search_type == 'partial':
            cursor.execute("""
                SELECT c.*, t.designation as table_designation
                FROM commande c
                LEFT JOIN restaurant_tables t ON c.idtable = t.idtable
                WHERE c.nomcli LIKE %s
                ORDER BY c.datecom DESC
            """, (f'%{nomcli}%',))
        else:
            cursor.execute("""
                SELECT c.*, t.designation as table_designation
                FROM commande c
                LEFT JOIN restaurant_tables t ON c.idtable = t.idtable
                WHERE c.nomcli = %s
                ORDER BY c.datecom DESC
            """, (nomcli,))
            
        commandes = cursor.fetchall()

        for commande in commandes:
            cursor.execute("""
                SELECT cp.idplat, m.nomplat, cp.quantite, cp.prix_unitaire
                FROM commande_plats cp
                JOIN menu m ON cp.idplat = m.idplat
                WHERE cp.idcom = %s
            """, (commande['idcom'],))
            commande['plats'] = cursor.fetchall()

        return jsonify(commandes)

    except Error as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

# Route pour lister les clients pour une date donnée ou entre deux dates
@app.route('/clients', methods=['GET'])
def get_clients():
    conn = create_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500

    cursor = conn.cursor(dictionary=True)

    try:
        date_debut = request.args.get('date_debut')
        date_fin = request.args.get('date_fin')
        
        sql = """
            SELECT DISTINCT nomcli, MAX(datecom) as derniere_visite, COUNT(*) as nb_commandes
            FROM commande
        """
        params = []
        
        # Ajout des filtres de date
        if date_debut and date_fin:
            sql += " WHERE datecom BETWEEN %s AND %s"
            params.extend([date_debut, date_fin])
        elif date_debut:
            sql += " WHERE datecom = %s"
            params.append(date_debut)
            
        sql += " GROUP BY nomcli ORDER BY derniere_visite DESC"
        
        cursor.execute(sql, params)
        clients = cursor.fetchall()
        
        # Pour chaque client, ajouter le total dépensé
        for client in clients:
            cursor.execute("""
                SELECT SUM(montant_total) as total_depense
                FROM commande
                WHERE nomcli = %s
            """, (client['nomcli'],))
            client['total_depense'] = cursor.fetchone()['total_depense'] or 0

        return jsonify(clients)

    except Error as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

# Génération de facture PDF
@app.route('/facture/<idcom>', methods=['GET'])
def generate_facture(idcom):
    conn = create_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500

    cursor = conn.cursor(dictionary=True)

    try:
        # Récupération de la commande
        cursor.execute("""
            SELECT c.*, t.designation 
            FROM commande c
            LEFT JOIN restaurant_tables t ON c.idtable = t.idtable
            WHERE c.idcom = %s
        """, (idcom,))
        commande = cursor.fetchone()
        if not commande:
            return jsonify({'error': 'Commande introuvable'}), 404

        # Récupération des plats
        cursor.execute("""
            SELECT m.nomplat, cp.prix_unitaire, cp.quantite
            FROM commande_plats cp
            JOIN menu m ON cp.idplat = m.idplat
            WHERE cp.idcom = %s
        """, (idcom,))
        plats = cursor.fetchall()

        # Création du PDF
        pdf = FPDF()
        pdf.add_page()
        pdf.set_font("Arial", size=12)
        
        # En-tête
        pdf.cell(200, 10, txt="NOM DU RESTAURANT", ln=1, align='C')
        pdf.cell(200, 10, txt=f"Code Commande : {commande['idcom']}", ln=1)
        pdf.cell(200, 10, txt=f"Nom du Client : {commande['nomcli']}", ln=1)
        if commande['typecom'] == 'sur place':
            pdf.cell(200, 10, txt=f"Table : {commande.get('designation', 'Non assignée')}", ln=1)
        else:
            pdf.cell(200, 10, txt="À emporter", ln=1)
        pdf.cell(200, 10, txt=f"Date : {commande['datecom'].strftime('%d/%m/%Y %H:%M') if isinstance(commande['datecom'], datetime.datetime) else commande['datecom']}", ln=1)
        pdf.cell(200, 10, txt="Votre facture en détail", ln=1)
        
        # Tableau des plats
        pdf.cell(60, 10, "Menu", 1)
        pdf.cell(30, 10, "PU (Ar)", 1)
        pdf.cell(30, 10, "Unité", 1)
        pdf.cell(40, 10, "Total (Ar)", 1)
        pdf.ln()
        
        total = 0
        for plat in plats:
            subtotal = plat['prix_unitaire'] * plat['quantite']
            total += subtotal
            
            pdf.cell(60, 10, plat['nomplat'], 1)
            pdf.cell(30, 10, f"{plat['prix_unitaire']:,}", 1, 0, 'R')
            pdf.cell(30, 10, str(plat['quantite']), 1, 0, 'C')
            pdf.cell(40, 10, f"{subtotal:,}", 1, 0, 'R')
            pdf.ln()
        
        # Total
        pdf.cell(120, 10, "TOTAL :", 1)
        pdf.cell(40, 10, f"{total:,} Ariary", 1)

        # Sauvegarde
        if not os.path.exists('factures'):
            os.makedirs('factures')
        
        filename = f"factures/facture_{idcom}.pdf"
        pdf.output(filename)
        
        # Mise à jour du statut de la commande
        cursor.execute("UPDATE commande SET statut = 'payé' WHERE idcom = %s", (idcom,))
        
        # Si la commande était sur table, libérer la table
        if commande['idtable'] and commande['typecom'] == 'sur place':
            cursor.execute("UPDATE restaurant_tables SET occupation = FALSE WHERE idtable = %s", (commande['idtable'],))
        
        conn.commit()
        
        # Renvoyer le fichier au lieu du JSON
        if request.args.get('download', 'false').lower() == 'true':
            return send_file(filename, as_attachment=True)
        
        return jsonify({
            'message': 'Facture générée',
            'filename': filename,
            'total': total
        })

    except Error as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

# ===== RÉSERVATIONS =====
@app.route('/reservations', methods=['GET', 'POST'])
def handle_reservations():
    conn = create_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500

    cursor = conn.cursor(dictionary=True)

    try:
        if request.method == 'GET':
            date = request.args.get('date')
            client = request.args.get('client')
            
            sql = """
                SELECT r.*, t.designation 
                FROM reserver r
                JOIN restaurant_tables t ON r.idtable = t.idtable
            """
            params = []
            
            # Filtrage par date ou client
            conditions = []
            if date:
                conditions.append("DATE(r.date_de_reserv) = %s")
                params.append(date)
            if client:
                conditions.append("r.nomcli LIKE %s")
                params.append(f"%{client}%")
                
            if conditions:
                sql += " WHERE " + " AND ".join(conditions)
                
            sql += " ORDER BY r.date_de_reserv"
            
            cursor.execute(sql, params)
            return jsonify(cursor.fetchall())

        elif request.method == 'POST':
            data = request.json
            required = ['idreserv', 'idtable', 'date_de_reserv', 'nomcli']
            if not all(field in data for field in required):
                return jsonify({'error': 'Champs manquants'}), 400
                
            # Vérification que la table existe
            cursor.execute("SELECT * FROM restaurant_tables WHERE idtable = %s", (data['idtable'],))
            if not cursor.fetchone():
                return jsonify({'error': 'Table introuvable'}), 404

            # Date de fin de réservation (par défaut +2h si non fournie)
            date_reserve = data.get('date_reserve')
            if not date_reserve:
                date_de_reserv = datetime.datetime.fromisoformat(data['date_de_reserv'].replace('Z', '+00:00'))
                date_reserve = (date_de_reserv + datetime.timedelta(hours=2)).isoformat()

            # Vérification des conflits de réservation
            cursor.execute("""
                SELECT COUNT(*) as conflicts 
                FROM reserver 
                WHERE idtable = %sAND (
                    (%s BETWEEN date_de_reserv AND date_reserve) OR
                    (%s BETWEEN date_de_reserv AND date_reserve) OR
                    (date_de_reserv BETWEEN %s AND %s)
                )
                AND idreserv != %s
            """, (
                data['idtable'],
                data['date_de_reserv'],
                date_reserve,
                data['date_de_reserv'],
                date_reserve,
                data.get('idreserv', '')  # Pour éviter les conflits lors de la mise à jour
            ))
            
            if cursor.fetchone()['conflicts'] > 0:
                return jsonify({'error': 'Conflit de réservation: la table est déjà réservée pour cette période'}), 400

            # Création de la réservation
            cursor.execute("""
                INSERT INTO reserver 
                (idreserv, idtable, date_de_reserv, date_reserve, nomcli)
                VALUES (%s, %s, %s, %s, %s)
                ON DUPLICATE KEY UPDATE
                idtable = VALUES(idtable),
                date_de_reserv = VALUES(date_de_reserv),
                date_reserve = VALUES(date_reserve),
                nomcli = VALUES(nomcli)
            """, (
                data['idreserv'],
                data['idtable'],
                data['date_de_reserv'],
                date_reserve,
                data['nomcli']
            ))

            conn.commit()
            return jsonify({'message': 'Réservation créée'}), 201

    except Error as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/reservations/<idreserv>', methods=['GET', 'PUT', 'DELETE'])
def manage_reservation(idreserv):
    conn = create_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500

    cursor = conn.cursor(dictionary=True)

    try:
        if request.method == 'GET':
            cursor.execute("""
                SELECT r.*, t.designation 
                FROM reserver r
                JOIN restaurant_tables t ON r.idtable = t.idtable
                WHERE r.idreserv = %s
            """, (idreserv,))
            
            reservation = cursor.fetchone()
            if not reservation:
                return jsonify({'error': 'Réservation non trouvée'}), 404
                
            return jsonify(reservation)
            
        elif request.method == 'PUT':
            data = request.json
            
            # Vérifier si la réservation existe
            cursor.execute("SELECT * FROM reserver WHERE idreserv = %s", (idreserv,))
            if not cursor.fetchone():
                return jsonify({'error': 'Réservation non trouvée'}), 404
                
            # Vérification que la table existe
            if 'idtable' in data:
                cursor.execute("SELECT * FROM restaurant_tables WHERE idtable = %s", (data['idtable'],))
                if not cursor.fetchone():
                    return jsonify({'error': 'Table introuvable'}), 404
            
            # Date de fin de réservation (par défaut +2h si non fournie)
            date_de_reserv = data.get('date_de_reserv')
            date_reserve = data.get('date_reserve')
            
            if date_de_reserv and not date_reserve:
                date_obj = datetime.datetime.fromisoformat(date_de_reserv.replace('Z', '+00:00'))
                date_reserve = (date_obj + datetime.timedelta(hours=2)).isoformat()
            
            # Vérification des conflits si les dates ou tables ont changé
            if (date_de_reserv or date_reserve or 'idtable' in data):
                # Récupérer les valeurs actuelles pour comparaison
                cursor.execute("""
                    SELECT idtable, date_de_reserv, date_reserve
                    FROM reserver
                    WHERE idreserv = %s
                """, (idreserv,))
                current = cursor.fetchone()
                
                # N'utiliser les nouvelles valeurs que si elles sont fournies
                new_idtable = data.get('idtable', current['idtable'])
                new_date_de_reserv = date_de_reserv or current['date_de_reserv'].isoformat() if isinstance(current['date_de_reserv'], datetime.datetime) else current['date_de_reserv']
                new_date_reserve = date_reserve or current['date_reserve'].isoformat() if isinstance(current['date_reserve'], datetime.datetime) else current['date_reserve']
                
                # Vérifier les conflits uniquement si quelque chose a changé
                if (new_idtable != current['idtable'] or 
                    new_date_de_reserv != current['date_de_reserv'] or 
                    new_date_reserve != current['date_reserve']):
                    
                    cursor.execute("""
                        SELECT COUNT(*) as conflicts 
                        FROM reserver 
                        WHERE idtable = %s 
                        AND (
                            (%s BETWEEN date_de_reserv AND date_reserve) OR
                            (%s BETWEEN date_de_reserv AND date_reserve) OR
                            (date_de_reserv BETWEEN %s AND %s)
                        )
                        AND idreserv != %s
                    """, (
                        new_idtable,
                        new_date_de_reserv,
                        new_date_reserve,
                        new_date_de_reserv,
                        new_date_reserve,
                        idreserv
                    ))
                    
                    if cursor.fetchone()['conflicts'] > 0:
                        return jsonify({'error': 'Conflit de réservation: la table est déjà réservée pour cette période'}), 400
            
            # Construction dynamique de la requête de mise à jour
            update_fields = []
            params = []
            
            if 'idtable' in data:
                update_fields.append("idtable = %s")
                params.append(data['idtable'])
            
            if date_de_reserv:
                update_fields.append("date_de_reserv = %s")
                params.append(date_de_reserv)
            
            if date_reserve:
                update_fields.append("date_reserve = %s")
                params.append(date_reserve)
            
            if 'nomcli' in data:
                update_fields.append("nomcli = %s")
                params.append(data['nomcli'])
            
            if not update_fields:
                return jsonify({'message': 'Aucune modification effectuée'}), 200
            
            # Ajout de l'ID de réservation à la fin des paramètres
            params.append(idreserv)
            
            # Exécution de la requête de mise à jour
            cursor.execute(
                f"UPDATE reserver SET {', '.join(update_fields)} WHERE idreserv = %s",
                params
            )
            
            conn.commit()
            return jsonify({'message': f'Réservation {idreserv} mise à jour'})
            
        elif request.method == 'DELETE':
            # Vérifier si la réservation existe
            cursor.execute("SELECT * FROM reserver WHERE idreserv = %s", (idreserv,))
            if not cursor.fetchone():
                return jsonify({'error': 'Réservation non trouvée'}), 404
            
            # Suppression
            cursor.execute("DELETE FROM reserver WHERE idreserv = %s", (idreserv,))
            conn.commit()
            return jsonify({'message': f'Réservation {idreserv} supprimée'}), 200

    except Error as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

# Route pour vérifier la disponibilité des tables pour une période donnée
@app.route('/disponibilite-tables', methods=['GET'])
def check_disponibilite():
    conn = create_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500

    cursor = conn.cursor(dictionary=True)

    try:
        date_debut = request.args.get('date_debut')
        date_fin = request.args.get('date_fin')
        
        if not date_debut:
            return jsonify({'error': 'date_debut est requise'}), 400
            
        if not date_fin:
            # Par défaut, fin = début + 2h
            date_debut_obj = datetime.datetime.fromisoformat(date_debut.replace('Z', '+00:00'))
            date_fin = (date_debut_obj + datetime.timedelta(hours=2)).isoformat()
        
        # Récupérer toutes les tables
        cursor.execute("SELECT * FROM restaurant_tables")
        tables = cursor.fetchall()
        
        for table in tables:
            # Vérifier si la table est occupée actuellement
            cursor.execute("""
                SELECT occupation FROM restaurant_tables
                WHERE idtable = %s
            """, (table['idtable'],))
            table_status = cursor.fetchone()
            table['est_occupee'] = table_status['occupation'] if table_status else False
            
            # Vérifier si la table a des réservations pour la période
            cursor.execute("""
                SELECT * FROM reserver
                WHERE idtable = %s
                AND (
                    (%s BETWEEN date_de_reserv AND date_reserve) OR
                    (%s BETWEEN date_de_reserv AND date_reserve) OR
                    (date_de_reserv BETWEEN %s AND %s)
                )
            """, (
                table['idtable'],
                date_debut,
                date_fin,
                date_debut,
                date_fin
            ))
            reservations = cursor.fetchall()
            table['reservations'] = reservations
            table['est_disponible'] = not table['est_occupee'] and len(reservations) == 0
        
        return jsonify(tables)

    except Error as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

# ===== STATISTIQUES =====
@app.route('/stats/recettes', methods=['GET'])
def get_stats():
    conn = create_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500

    cursor = conn.cursor(dictionary=True)

    try:
        # Recette totale
        cursor.execute("""
            SELECT SUM(cp.quantite * cp.prix_unitaire) as total
            FROM commande c
            JOIN commande_plats cp ON c.idcom = cp.idcom
        """)
        total = cursor.fetchone()['total'] or 0

        # Recettes des 6 derniers mois
        cursor.execute("""
            SELECT 
                DATE_FORMAT(c.datecom, '%Y-%m') as mois,
                SUM(cp.quantite * cp.prix_unitaire) as montant
            FROM commande c
            JOIN commande_plats cp ON c.idcom = cp.idcom
            WHERE c.datecom >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
            GROUP BY DATE_FORMAT(c.datecom, '%Y-%m')
            ORDER BY mois
        """)
        recettes_6mois = cursor.fetchall()

        # Plats les plus vendus (déjà correct)
        cursor.execute("""
            SELECT 
                m.idplat,
                m.nomplat,
                SUM(cp.quantite) as quantite,
                SUM(cp.quantite * cp.prix_unitaire) as chiffre_affaires
            FROM commande_plats cp
            JOIN menu m ON cp.idplat = m.idplat
            GROUP BY m.idplat, m.nomplat
            ORDER BY quantite DESC
            LIMIT 10
        """)
        top_plats = cursor.fetchall()

        # Statistiques par type de commande
        cursor.execute("""
            SELECT 
                c.typecom,
                COUNT(*) as nombre,
                SUM(cp.quantite * cp.prix_unitaire) as montant
            FROM commande c
            JOIN commande_plats cp ON c.idcom = cp.idcom
            GROUP BY c.typecom
        """)
        stats_par_type = cursor.fetchall()

        # Statistiques par jour de la semaine
        cursor.execute("""
            SELECT 
                DAYNAME(c.datecom) as jour,
                COUNT(*) as nombre,
                SUM(cp.quantite * cp.prix_unitaire) as montant
            FROM commande c
            JOIN commande_plats cp ON c.idcom = cp.idcom
            GROUP BY DAYNAME(c.datecom)
            ORDER BY FIELD(DAYNAME(c.datecom), 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')
        """)
        stats_par_jour = cursor.fetchall()

        return jsonify({
            'total': total,
            'recettes_6mois': recettes_6mois,
            'top_plats': top_plats,
            'stats_par_type': stats_par_type,
            'stats_par_jour': stats_par_jour
        })

    except Error as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/stats/histogramme', methods=['GET'])
def get_histogramme():
    conn = create_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500

    cursor = conn.cursor(dictionary=True)

    try:
        # Recettes par mois (6 derniers mois)
        cursor.execute("""
            SELECT 
                DATE_FORMAT(c.datecom, '%Y-%m') as mois,
                DATE_FORMAT(c.datecom, '%b %Y') as mois_format,
                SUM(cp.quantite * cp.prix_unitaire) as montant
            FROM commande c
            JOIN commande_plats cp ON c.idcom = cp.idcom
            WHERE c.datecom >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
            GROUP BY mois, mois_format
            ORDER BY mois
        """)
        recettes_mensuelles = cursor.fetchall()
        
        # S'assurer que tous les 6 derniers mois sont présents
        date_actuelle = datetime.datetime.now()
        mois_requis = []
        
        for i in range(5, -1, -1):
            date_mois = date_actuelle - datetime.timedelta(days=30 * i)
            mois_requis.append({
                'mois': date_mois.strftime('%Y-%m'),
                'mois_format': date_mois.strftime('%b %Y'),
                'montant': 0
            })
        
        # Fusionner avec les résultats réels
        recettes_completes = []
        mois_existants = [r['mois'] for r in recettes_mensuelles]
        
        for mois in mois_requis:
            if mois['mois'] in mois_existants:
                for recette in recettes_mensuelles:
                    if recette['mois'] == mois['mois']:
                        recettes_completes.append(recette)
                        break
            else:
                recettes_completes.append(mois)

        return jsonify(recettes_completes)

    except Error as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

# ===== RECHERCHE =====
@app.route('/recherche/menu', methods=['GET'])
def recherche_menu():
    conn = create_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500

    cursor = conn.cursor(dictionary=True)

    try:
        terme = request.args.get('terme', '')
        
        if not terme:
            return jsonify([])
            
        cursor.execute("""
            SELECT * FROM menu
            WHERE nomplat LIKE %s
            ORDER BY nomplat
        """, (f'%{terme}%',))
        
        resultats = cursor.fetchall()
        
        # Ajouter statistiques de vente pour chaque plat
        for plat in resultats:
            cursor.execute("""
                SELECT SUM(quantite) as nb_ventes
                FROM commande_plats
                WHERE idplat = %s
            """, (plat['idplat'],))
            stats = cursor.fetchone()
            plat['nb_ventes'] = stats['nb_ventes'] if stats and stats['nb_ventes'] else 0
        
        return jsonify(resultats)

    except Error as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/recherche/clients', methods=['GET'])
def recherche_clients():
    conn = create_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500

    cursor = conn.cursor(dictionary=True)

    try:
        terme = request.args.get('terme', '')
        
        if not terme:
            return jsonify([])
            
        cursor.execute("""
            SELECT DISTINCT nomcli,
                COUNT(idcom) as nb_commandes,
                MAX(datecom) as derniere_visite,
                SUM(montant_total) as total_depense
            FROM commande
            WHERE nomcli LIKE %s
            GROUP BY nomcli
            ORDER BY derniere_visite DESC
        """, (f'%{terme}%',))
        
        clients = cursor.fetchall()
        
        # Pour chaque client, récupérer ses réservations
        for client in clients:
            cursor.execute("""
                SELECT COUNT(*) as nb_reservations
                FROM reserver
                WHERE nomcli = %s
            """, (client['nomcli'],))
            reservations = cursor.fetchone()
            client['nb_reservations'] = reservations['nb_reservations'] if reservations else 0
        
        return jsonify(clients)

    except Error as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

# Point d'entrée de l'application
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)