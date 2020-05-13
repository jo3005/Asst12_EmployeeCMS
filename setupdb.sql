DROP DATABASE IF EXISTS cms;
CREATE database cms;

USE cms;

CREATE TABLE `department` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(30) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `employee` (
  `id` int NOT NULL AUTO_INCREMENT,
  `first_name` varchar(30) DEFAULT NULL,
  `last_name` varchar(30) DEFAULT NULL,
  `role_id` int DEFAULT NULL,
  `manager_id` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `role` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(30) DEFAULT NULL,
  `salary` decimal(10,0) DEFAULT NULL,
  `department_id` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE VIEW `cms`.`v_allemployees` AS
    SELECT 
        `cms`.`employee`.`first_name` AS `first_name`,
        `cms`.`employee`.`last_name` AS `last_name`,
        `cms`.`role`.`title` AS `title`,
        CONCAT(`managers`.`first_name`,
                ' ',
                `managers`.`last_name`) AS `manager_name`
    FROM
        ((`cms`.`employee`
        LEFT JOIN `cms`.`role` ON ((`cms`.`employee`.`role_id` = `cms`.`role`.`id`)))
        LEFT JOIN `cms`.`employee` `managers` ON ((`cms`.`employee`.`manager_id` = `managers`.`id`)));
        
CREATE VIEW `cms`.`v_allmanagers` AS
    SELECT 
        `cms`.`employee`.`id` AS `id`,
        CONCAT(`cms`.`employee`.`first_name`,
                ' ',
                `cms`.`employee`.`last_name`) AS `Name`,
        `cms`.`department`.`name` AS `Department`,
        `cms`.`role`.`title` AS `title`
    FROM
        ((`cms`.`employee`
        LEFT JOIN `cms`.`role` ON ((`cms`.`employee`.`role_id` = `cms`.`role`.`id`)))
        LEFT JOIN `cms`.`department` ON ((`cms`.`role`.`department_id` = `cms`.`department`.`id`)))
    WHERE
        (`cms`.`role`.`title` LIKE '%Manager')
    ORDER BY `cms`.`employee`.`id`;
    
CREATE VIEW `cms`.`v_employeesbymanager` AS
    SELECT 
        CONCAT(`manager`.`first_name`,
                ' ',
                `manager`.`last_name`) AS `manager`,
        CONCAT(`cms`.`employee`.`first_name`,
                ' ',
                `cms`.`employee`.`last_name`) AS `employee`
    FROM
        (`cms`.`employee`
        JOIN `cms`.`employee` `manager` ON ((`cms`.`employee`.`manager_id` = `manager`.`id`)))
    ORDER BY `manager`.`manager_id`;

CREATE VIEW `cms`.`v_empswithids` AS
    SELECT 
        `cms`.`employee`.`id` AS `id`,
        `cms`.`employee`.`role_id` AS `role_id`,
        `cms`.`employee`.`first_name` AS `first_name`,
        `cms`.`employee`.`last_name` AS `last_name`,
        `cms`.`role`.`title` AS `title`,
        CONCAT(`managers`.`first_name`,
                ' ',
                `managers`.`last_name`) AS `manager_name`
    FROM
        ((`cms`.`employee`
        LEFT JOIN `cms`.`role` ON ((`cms`.`employee`.`role_id` = `cms`.`role`.`id`)))
        LEFT JOIN `cms`.`employee` `managers` ON ((`cms`.`employee`.`manager_id` = `managers`.`id`)));
        
CREATE VIEW `cms`.`v_roles` AS
    SELECT 
        `cms`.`role`.`id` AS `role_id`,
        `cms`.`role`.`title` AS `title`,
        `cms`.`role`.`salary` AS `salary`,
        `cms`.`department`.`name` AS `Department_name`
    FROM
        (`cms`.`role`
        LEFT JOIN `cms`.`department` ON ((`cms`.`role`.`department_id` = `cms`.`department`.`id`)));
        
CREATE VIEW `cms`.`v_salariesbydept` AS
    SELECT 
        `cms`.`department`.`name` AS `name`,
        SUM(`cms`.`role`.`salary`) AS `total_Salaries`
    FROM
        ((`cms`.`employee`
        JOIN `cms`.`role` ON ((`cms`.`employee`.`role_id` = `cms`.`role`.`id`)))
        JOIN `cms`.`department` ON ((`cms`.`role`.`department_id` = `cms`.`department`.`id`)))
    GROUP BY `cms`.`role`.`department_id`;
 

 