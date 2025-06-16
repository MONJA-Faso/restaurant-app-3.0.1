-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Hôte : localhost
-- Généré le : dim. 08 juin 2025 à 21:27
-- Version du serveur : 10.4.32-MariaDB
-- Version de PHP : 8.1.25

CREATE DATABASE IF NOT EXISTS restaurant_db;
USE restaurant_db;

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = '+03:00';



/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de données : `restaurant_db`


USE restaurant_db;

--

DELIMITER $$
--
-- Procédures
--
CREATE DEFINER=`root`@`localhost` PROCEDURE `liberer_table` (IN `p_idtable` VARCHAR(10))   BEGIN
    UPDATE restaurant_tables SET occupation = FALSE WHERE idtable = p_idtable;
END$$

DELIMITER ;

-- --------------------------------------------------------

--
-- Structure de la table `commande`
--

CREATE TABLE `commande` (
  `idcom` varchar(10) NOT NULL,
  `nomcli` varchar(50) NOT NULL,
  `typecom` enum('sur place','à emporter') NOT NULL,
  `idtable` varchar(10) DEFAULT NULL,
  `datecom` date NOT NULL,
  `montant_total` decimal(10,2) DEFAULT 0.00,
  `statut` enum('en attente','en cours','terminé','payé') DEFAULT 'en attente'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `commande`
--

INSERT INTO `commande` (`idcom`, `nomcli`, `typecom`, `idtable`, `datecom`, `montant_total`, `statut`) VALUES
('C1', 'Monja', 'sur place', 'T1', '2025-04-19', 22500.00, 'payé'),
('C11', 'Dolphin', 'sur place', 'T1', '2025-05-19', 59500.00, 'en attente'),
('C2', 'Faso', 'sur place', 'T3', '2025-04-19', 46000.00, 'payé'),
('C3', 'Rabefinoana', 'sur place', 'T5', '2025-04-19', 86000.00, 'payé'),
('C4', 'Dev', 'à emporter', NULL, '2025-04-23', 75000.00, 'en attente'),
('C5', 'Rarra', 'à emporter', NULL, '2025-05-18', 40000.00, 'payé');

-- --------------------------------------------------------

--
-- Structure de la table `commande_plats`
--

CREATE TABLE `commande_plats` (
  `id` int(11) NOT NULL,
  `idcom` varchar(10) NOT NULL,
  `idplat` varchar(10) NOT NULL,
  `quantite` int(11) NOT NULL DEFAULT 1,
  `prix_unitaire` decimal(10,2) DEFAULT 0.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `commande_plats`
--

INSERT INTO `commande_plats` (`id`, `idcom`, `idplat`, `quantite`, `prix_unitaire`) VALUES
(3, 'C1', 'P1', 2, 10000.00),
(4, 'C1', 'P2', 1, 2500.00),
(5, 'C2', 'P4', 1, 12000.00),
(6, 'C2', 'P3', 3, 8000.00),
(7, 'C2', 'P2', 4, 2500.00),
(8, 'C3', 'P3', 4, 8000.00),
(9, 'C3', 'P2', 4, 2500.00),
(10, 'C3', 'P1', 2, 10000.00),
(11, 'C3', 'P4', 2, 12000.00),
(14, 'C4', 'P1', 6, 10000.00),
(15, 'C4', 'P2', 6, 2500.00),
(16, 'C5', 'P3', 2, 8000.00),
(17, 'C5', 'P4', 2, 12000.00),
(18, 'C11', 'P1', 2, 10000.00),
(19, 'C11', 'P5', 1, 2000.00),
(20, 'C11', 'P2', 15, 2500.00);

-- --------------------------------------------------------

--
-- Structure de la table `menu`
--

CREATE TABLE `menu` (
  `idplat` varchar(10) NOT NULL,
  `nomplat` varchar(50) NOT NULL,
  `pu` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `menu`
--

INSERT INTO `menu` (`idplat`, `nomplat`, `pu`) VALUES
('P1', 'Mine sao poulet', 10000),
('P2', 'Jus naturel', 2500),
('P3', 'Salade César', 8000),
('P4', 'Pizza Margherita', 12000),
('P5', 'Kadaka Tsaramaso', 2000),
('P6', 'Akoho ronony', 4000),
('P7', 'Angivy ritra', 15000);

-- --------------------------------------------------------

--
-- Structure de la table `reserver`
--

CREATE TABLE `reserver` (
  `idreserv` varchar(10) NOT NULL,
  `idtable` varchar(10) NOT NULL,
  `date_de_reserv` datetime NOT NULL,
  `date_reserve` datetime NOT NULL,
  `nomcli` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `reserver`
--

INSERT INTO `reserver` (`idreserv`, `idtable`, `date_de_reserv`, `date_reserve`, `nomcli`) VALUES
('R1', 'T1', '2025-04-22 19:38:00', '2025-04-22 20:38:00', 'MONJA'),
('R2', 'T2', '2025-05-19 08:56:00', '2025-05-19 09:56:00', 'Faso'),
('R3', 'T3', '2025-05-26 05:32:00', '2025-05-27 06:32:00', 'Toto');

-- --------------------------------------------------------

--
-- Structure de la table `restaurant_tables`
--

CREATE TABLE `restaurant_tables` (
  `idtable` varchar(10) NOT NULL,
  `designation` varchar(50) NOT NULL,
  `occupation` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `restaurant_tables`
--

INSERT INTO `restaurant_tables` (`idtable`, `designation`, `occupation`) VALUES
('', '', 0),
('T1', 'Table 1', 0),
('T2', 'Sampanana', 0),
('T3', 'Table 3', 0),
('T4', 'Table 4', 0),
('T5', 'Table 5 - Speciale président', 0);

--
-- Index pour les tables déchargées
--

--
-- Index pour la table `commande`
--
ALTER TABLE `commande`
  ADD PRIMARY KEY (`idcom`),
  ADD KEY `idtable` (`idtable`);

--
-- Index pour la table `commande_plats`
--
ALTER TABLE `commande_plats`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idcom` (`idcom`),
  ADD KEY `idplat` (`idplat`);

--
-- Index pour la table `menu`
--
ALTER TABLE `menu`
  ADD PRIMARY KEY (`idplat`);

--
-- Index pour la table `reserver`
--
ALTER TABLE `reserver`
  ADD PRIMARY KEY (`idreserv`),
  ADD KEY `idtable` (`idtable`);

--
-- Index pour la table `restaurant_tables`
--
ALTER TABLE `restaurant_tables`
  ADD PRIMARY KEY (`idtable`);

--
-- AUTO_INCREMENT pour les tables déchargées
--

--
-- AUTO_INCREMENT pour la table `commande_plats`
--
ALTER TABLE `commande_plats`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- Contraintes pour les tables déchargées
--

--
-- Contraintes pour la table `commande`
--
ALTER TABLE `commande`
  ADD CONSTRAINT `commande_ibfk_1` FOREIGN KEY (`idtable`) REFERENCES `restaurant_tables` (`idtable`);

--
-- Contraintes pour la table `commande_plats`
--
ALTER TABLE `commande_plats`
  ADD CONSTRAINT `commande_plats_ibfk_1` FOREIGN KEY (`idcom`) REFERENCES `commande` (`idcom`) ON DELETE CASCADE,
  ADD CONSTRAINT `commande_plats_ibfk_2` FOREIGN KEY (`idplat`) REFERENCES `menu` (`idplat`);

--
-- Contraintes pour la table `reserver`
--
ALTER TABLE `reserver`
  ADD CONSTRAINT `reserver_ibfk_1` FOREIGN KEY (`idtable`) REFERENCES `restaurant_tables` (`idtable`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
