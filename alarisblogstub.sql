-- --------------------------------------------------------
-- This is the stub of Alaris blog engine
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;

CREATE TABLE IF NOT EXISTS `blog` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `body` text COLLATE utf8_hungarian_ci NOT NULL,
  `date` datetime NOT NULL,
  `topic` int(11) NOT NULL DEFAULT '0',
  `title` varchar(255) COLLATE utf8_hungarian_ci NOT NULL,
  `top` tinyint(1) NOT NULL DEFAULT '0',
  `grade` int(50) DEFAULT NULL,
  `tag` varchar(255) COLLATE utf8_hungarian_ci NOT NULL,
  PRIMARY KEY (`id`),
  KEY `date` (`date`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_hungarian_ci;


CREATE TABLE IF NOT EXISTS `comment` (
  `date` datetime NOT NULL,
  `id` datetime NOT NULL,
  `whois` varchar(255) NOT NULL,
  `msg` text NOT NULL,
  `ip` varchar(17) NOT NULL,
  `type` int(11) NOT NULL DEFAULT '0'
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `tags` (
  `id` int(11) NOT NULL,
  `name` varchar(200) DEFAULT NULL,
  `background` varchar(200) DEFAULT NULL,
  `startdate` date DEFAULT NULL,
  `enddate` date DEFAULT NULL,
  `customjs` text,
  `style` text,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IF(@OLD_FOREIGN_KEY_CHECKS IS NULL, 1, @OLD_FOREIGN_KEY_CHECKS) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
