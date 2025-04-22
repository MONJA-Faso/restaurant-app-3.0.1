-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Hôte : localhost
-- Généré le : sam. 19 avr. 2025 à 10:38
-- Version du serveur : 10.4.32-MariaDB
-- Version de PHP : 8.1.25

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de données : `restaurant_db`
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
('P4', 'Pizza Margherita', 12000);

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
('R1', 'T3', '2025-04-15 10:30:00', '2025-04-17 20:00:00', 'Monja');

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
('T1', 'Table 1', 0),
('T2', 'Sampanana', 0),
('T3', 'Table 3', 0),
('T4', 'Table 4', 0);

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

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
