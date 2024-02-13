INSERT INTO migrations (`name`) VALUES ("Migration 1"), ("Migration 2");

INSERT INTO `users` VALUES (
	"6158081ca3c0c1619d74088a", --id
	"3100509430204398322951", -- gid
	"John", -- first_name
	"Doe", -- last_name
	"john.doe@example.com", -- email
	"2021-05-06 00:01:53", -- created_at
	"2024-02-03 12:37:54", -- updated_at
	'{"tour":1,"previous_notification":"2021-08-21T15:46:57.000-05:00","redirectFromHome":false,"overallCredits":134,"overallGpa":3.85,"gpaSemester":"2023W"}',
	0, -- total_school_changes
	null -- donated_at
);

INSERT INTO `courses` VALUES (
	"65ccd764244249271dc194f3",
	"6158081ca3c0c1619d74088a",
	"2020F",
	"LERN-101",
	3,
	'{"a":90,"b":80,"c":70,"d":60}',
	"{}"
);

INSERT INTO categories VALUES ("65ccd8570a4770267b0596f9", "65ccd764244249271dc194f3", "Homework", 25, 100, 3),
															("65ccd89b2a3d4dcdcd77eca8", "65ccd764244249271dc194f3", "Labs",	25, 100, 0),
															("65ccd8a12c4fdc8ad12edc32", "65ccd764244249271dc194f3", "Exam 1",	12.5, 100, 3),
															("65ccd8a4bef7915a90e3658b", "65ccd764244249271dc194f3", "Exam 2",	12.5, 100, 3),
															("65ccd8a8faaa33b9b9f18563", "65ccd764244249271dc194f3", "Final",	25, 100, 3);

INSERT INTO grades VALUES ("65ccd9fe660bfe9914688654", "6158081ca3c0c1619d74088a", "65ccd764244249271dc194f3", "65ccd8570a4770267b0596f9", "Homework 1", 92),
													("65ccd9fe660bfe9914688655", "6158081ca3c0c1619d74088a", "65ccd764244249271dc194f3", "65ccd8570a4770267b0596f9", "Homework 2", 88),
													("65ccd9fe660bfe9914688666", "6158081ca3c0c1619d74088a", "65ccd764244249271dc194f3", "65ccd8570a4770267b0596f9", "Homework 3", 100),
													("65ccd9fe660bfe9914688656", "6158081ca3c0c1619d74088a", "65ccd764244249271dc194f3", "65ccd8570a4770267b0596f9", "Homework 4", 105),
													("65ccd9fe660bfe9914688657", "6158081ca3c0c1619d74088a", "65ccd764244249271dc194f3", "65ccd8570a4770267b0596f9", "Homework 5", 0),
													("65ccd9fe660bfe9914688658", "6158081ca3c0c1619d74088a", "65ccd764244249271dc194f3", "65ccd8570a4770267b0596f9", "Homework 6", 0),
													("65ccd9fe660bfe9914688659", "6158081ca3c0c1619d74088a", "65ccd764244249271dc194f3", "65ccd8570a4770267b0596f9", "Homework 7", 99),
													("65ccd9fe660bfe9914688660", "6158081ca3c0c1619d74088a", "65ccd764244249271dc194f3", "65ccd8570a4770267b0596f9", "Homework 8", 80),
													("65ccd9fe660bfe9914688661", "6158081ca3c0c1619d74088a", "65ccd764244249271dc194f3", "65ccd8570a4770267b0596f9", "Homework 9", 77),

													("65ccd9fe660bfe9914688670", "6158081ca3c0c1619d74088a", "65ccd764244249271dc194f3", "65ccd89b2a3d4dcdcd77eca8", "Lab 1", 78),
													("65ccd9fe660bfe9914688671", "6158081ca3c0c1619d74088a", "65ccd764244249271dc194f3", "65ccd89b2a3d4dcdcd77eca8", "Lab 2", 90),
													("65ccd9fe660bfe9914688672", "6158081ca3c0c1619d74088a", "65ccd764244249271dc194f3", "65ccd89b2a3d4dcdcd77eca8", "Lab 3", 90),
													("65ccd9fe660bfe9914688673", "6158081ca3c0c1619d74088a", "65ccd764244249271dc194f3", "65ccd89b2a3d4dcdcd77eca8", "Lab 4", 55),
													("65ccd9fe660bfe9914688674", "6158081ca3c0c1619d74088a", "65ccd764244249271dc194f3", "65ccd89b2a3d4dcdcd77eca8", "Lab 5", 0),
													("65ccd9fe660bfe9914688675", "6158081ca3c0c1619d74088a", "65ccd764244249271dc194f3", "65ccd89b2a3d4dcdcd77eca8", "Lab 6", 100),
													("65ccd9fe660bfe9914688676", "6158081ca3c0c1619d74088a", "65ccd764244249271dc194f3", "65ccd89b2a3d4dcdcd77eca8", "Lab 7", 100),
													("65ccd9fe660bfe9914688677", "6158081ca3c0c1619d74088a", "65ccd764244249271dc194f3", "65ccd89b2a3d4dcdcd77eca8", "Lab 8", 97),
													("65ccd9fe660bfe9914688678", "6158081ca3c0c1619d74088a", "65ccd764244249271dc194f3", "65ccd89b2a3d4dcdcd77eca8", "Lab 9", 92),

													("65ccd9fe660bfe9914688663", "6158081ca3c0c1619d74088a", "65ccd764244249271dc194f3", "65ccd8a12c4fdc8ad12edc32", null, null),
													("65ccd9fe660bfe9914688664", "6158081ca3c0c1619d74088a", "65ccd764244249271dc194f3", "65ccd8a4bef7915a90e3658b", null, null),
													("65ccd9fe660bfe9914688665", "6158081ca3c0c1619d74088a", "65ccd764244249271dc194f3", "65ccd8a8faaa33b9b9f18563", null, null);

INSERT INTO `courses` VALUES (
	"65ccd764244249271dc194f4",
	"6158081ca3c0c1619d74088a",
	"2021S",
	"LERN-201",
	3,
	'{"a":90,"b":80,"c":70,"d":60}',
	"{}"
);

INSERT INTO categories VALUES ("65ccd8570a4770267b0596f0", "65ccd764244249271dc194f4", "Homework", 25, 100, 3),
															("65ccd89b2a3d4dcdcd77eca9", "65ccd764244249271dc194f4", "Labs",	25, 100, 0),
															("65ccd8a12c4fdc8ad12edc33", "65ccd764244249271dc194f4", "Exam 1",	12.5, 100, 3),
															("65ccd8a4bef7915a90e3658c", "65ccd764244249271dc194f4", "Exam 2",	12.5, 100, 3),
															("65ccd8a8faaa33b9b9f18564", "65ccd764244249271dc194f4", "Final",	25, 100, 3);

INSERT INTO grades VALUES ("65ccd9fe661bfe9914688654", "6158081ca3c0c1619d74088a", "65ccd764244249271dc194f4", "65ccd8570a4770267b0596f0", "Homework 1", null),
													("65ccd9fe661bfe9914688655", "6158081ca3c0c1619d74088a", "65ccd764244249271dc194f4", "65ccd8570a4770267b0596f0", "Homework 2", null),
													("65ccd9fe661bfe9914688666", "6158081ca3c0c1619d74088a", "65ccd764244249271dc194f4", "65ccd8570a4770267b0596f0", "Homework 3", null),
													("65ccd9fe661bfe9914688656", "6158081ca3c0c1619d74088a", "65ccd764244249271dc194f4", "65ccd8570a4770267b0596f0", "Homework 4", null),
													("65ccd9fe661bfe9914688657", "6158081ca3c0c1619d74088a", "65ccd764244249271dc194f4", "65ccd8570a4770267b0596f0", "Homework 5", null),
													("65ccd9fe661bfe9914688658", "6158081ca3c0c1619d74088a", "65ccd764244249271dc194f4", "65ccd8570a4770267b0596f0", "Homework 6", null),
													("65ccd9fe661bfe9914688659", "6158081ca3c0c1619d74088a", "65ccd764244249271dc194f4", "65ccd8570a4770267b0596f0", "Homework 7", null),
													("65ccd9fe661bfe9914688660", "6158081ca3c0c1619d74088a", "65ccd764244249271dc194f4", "65ccd8570a4770267b0596f0", "Homework 8", null),
													("65ccd9fe661bfe9914688661", "6158081ca3c0c1619d74088a", "65ccd764244249271dc194f4", "65ccd8570a4770267b0596f0", "Homework 9", null),

													("65ccd9fe661bfe9914688670", "6158081ca3c0c1619d74088a", "65ccd764244249271dc194f4", "65ccd89b2a3d4dcdcd77eca9", "Lab 1", null),
													("65ccd9fe661bfe9914688671", "6158081ca3c0c1619d74088a", "65ccd764244249271dc194f4", "65ccd89b2a3d4dcdcd77eca9", "Lab 2", null),
													("65ccd9fe661bfe9914688672", "6158081ca3c0c1619d74088a", "65ccd764244249271dc194f4", "65ccd89b2a3d4dcdcd77eca9", "Lab 3", null),
													("65ccd9fe661bfe9914688673", "6158081ca3c0c1619d74088a", "65ccd764244249271dc194f4", "65ccd89b2a3d4dcdcd77eca9", "Lab 4", null),
													("65ccd9fe661bfe9914688674", "6158081ca3c0c1619d74088a", "65ccd764244249271dc194f4", "65ccd89b2a3d4dcdcd77eca9", "Lab 5", null),
													("65ccd9fe661bfe9914688675", "6158081ca3c0c1619d74088a", "65ccd764244249271dc194f4", "65ccd89b2a3d4dcdcd77eca9", "Lab 6", null),
													("65ccd9fe661bfe9914688676", "6158081ca3c0c1619d74088a", "65ccd764244249271dc194f4", "65ccd89b2a3d4dcdcd77eca9", "Lab 7", null),
													("65ccd9fe661bfe9914688677", "6158081ca3c0c1619d74088a", "65ccd764244249271dc194f4", "65ccd89b2a3d4dcdcd77eca9", "Lab 8", null),
													("65ccd9fe661bfe9914688678", "6158081ca3c0c1619d74088a", "65ccd764244249271dc194f4", "65ccd89b2a3d4dcdcd77eca9", "Lab 9", null),

													("65ccd9fe661bfe9914688663", "6158081ca3c0c1619d74088a", "65ccd764244249271dc194f4", "65ccd8a12c4fdc8ad12edc33", null, null),
													("65ccd9fe661bfe9914688664", "6158081ca3c0c1619d74088a", "65ccd764244249271dc194f4", "65ccd8a4bef7915a90e3658c", null, null),
													("65ccd9fe661bfe9914688665", "6158081ca3c0c1619d74088a", "65ccd764244249271dc194f4", "65ccd8a8faaa33b9b9f18564", null, null);


INSERT INTO `users` VALUES (
	"65ccd764244249271dc194f4", --id
	"3100509430204398322951", -- gid
	"Jane", -- first_name
	"Doe", -- last_name
	"john.doe@example.com", -- email
	"2021-05-06 00:01:53", -- created_at
	"2024-02-03 12:37:54", -- updated_at
	'{"tour":1,"previous_notification":"2021-08-21T15:46:57.000-05:00","redirectFromHome":false,"overallCredits":134,"overallGpa":3.85,"gpaSemester":"2023W"}',
	0, -- total_school_changes
	null -- donated_at
);

INSERT INTO `courses` VALUES (
	"6158081ca3c0c1619d74088f",
	"65ccd764244249271dc194f4",
	"2020F",
	"LERN-101",
	3,
	'{"a":90,"b":80,"c":70,"d":60}',
	"{}"
);

INSERT INTO categories VALUES ("65ccd8570a4770267b0596c1", "6158081ca3c0c1619d74088f", "Homework", 25, 100, 3),
															("65ccd89b2a3d4dcdcd75eca8", "6158081ca3c0c1619d74088f", "Labs",	25, 100, 0),
															("65ccd8a12c4fdc8ad12edc34", "6158081ca3c0c1619d74088f", "Exam 1",	12.5, 100, 3),
															("65ccd8a4bef7915a90e3659c", "6158081ca3c0c1619d74088f", "Exam 2",	12.5, 100, 3),
															("65ccd8a8faaa33b9b9f18568", "6158081ca3c0c1619d74088f", "Final",	25, 100, 3);

INSERT INTO grades VALUES ("65ccd9fe660cfe9914688654", "6158081ca3c0c1619d74088f", "65ccd764244249271dc194f4", "65ccd8570a4770267b0596c1", "Homework 1", 92),
													("65ccd9fe660cfe9914688655", "6158081ca3c0c1619d74088f", "65ccd764244249271dc194f4", "65ccd8570a4770267b0596c1", "Homework 2", 88),
													("65ccd9fe660cfe9914688666", "6158081ca3c0c1619d74088f", "65ccd764244249271dc194f4", "65ccd8570a4770267b0596c1", "Homework 3", 100),
													("65ccd9fe660cfe9914688656", "6158081ca3c0c1619d74088f", "65ccd764244249271dc194f4", "65ccd8570a4770267b0596c1", "Homework 4", 105),
													("65ccd9fe660cfe9914688657", "6158081ca3c0c1619d74088f", "65ccd764244249271dc194f4", "65ccd8570a4770267b0596c1", "Homework 5", 0),
													("65ccd9fe660cfe9914688658", "6158081ca3c0c1619d74088f", "65ccd764244249271dc194f4", "65ccd8570a4770267b0596c1", "Homework 6", 0),
													("65ccd9fe660cfe9914688659", "6158081ca3c0c1619d74088f", "65ccd764244249271dc194f4", "65ccd8570a4770267b0596c1", "Homework 7", 99),
													("65ccd9fe660cfe9914688660", "6158081ca3c0c1619d74088f", "65ccd764244249271dc194f4", "65ccd8570a4770267b0596c1", "Homework 8", 80),
													("65ccd9fe660cfe9914688661", "6158081ca3c0c1619d74088f", "65ccd764244249271dc194f4", "65ccd8570a4770267b0596c1", "Homework 9", 77),

													("65ccd9fe660cfe9914688670", "6158081ca3c0c1619d74088f", "65ccd764244249271dc194f4", "65ccd89b2a3d4dcdcd75eca8", "Lab 1", 78),
													("65ccd9fe660cfe9914688671", "6158081ca3c0c1619d74088f", "65ccd764244249271dc194f4", "65ccd89b2a3d4dcdcd75eca8", "Lab 2", 90),
													("65ccd9fe660cfe9914688672", "6158081ca3c0c1619d74088f", "65ccd764244249271dc194f4", "65ccd89b2a3d4dcdcd75eca8", "Lab 3", 90),
													("65ccd9fe660cfe9914688673", "6158081ca3c0c1619d74088f", "65ccd764244249271dc194f4", "65ccd89b2a3d4dcdcd75eca8", "Lab 4", 55),
													("65ccd9fe660cfe9914688674", "6158081ca3c0c1619d74088f", "65ccd764244249271dc194f4", "65ccd89b2a3d4dcdcd75eca8", "Lab 5", 0),
													("65ccd9fe660cfe9914688675", "6158081ca3c0c1619d74088f", "65ccd764244249271dc194f4", "65ccd89b2a3d4dcdcd75eca8", "Lab 6", 100),
													("65ccd9fe660cfe9914688676", "6158081ca3c0c1619d74088f", "65ccd764244249271dc194f4", "65ccd89b2a3d4dcdcd75eca8", "Lab 7", 100),
													("65ccd9fe660cfe9914688677", "6158081ca3c0c1619d74088f", "65ccd764244249271dc194f4", "65ccd89b2a3d4dcdcd75eca8", "Lab 8", 97),
													("65ccd9fe660cfe9914688678", "6158081ca3c0c1619d74088f", "65ccd764244249271dc194f4", "65ccd89b2a3d4dcdcd75eca8", "Lab 9", 92),

													("65ccd9fe660cfe9914688663", "6158081ca3c0c1619d74088f", "65ccd764244249271dc194f4", "65ccd8a12c4fdc8ad12edc34", null, null),
													("65ccd9fe660cfe9914688664", "6158081ca3c0c1619d74088f", "65ccd764244249271dc194f4", "65ccd8a4bef7915a90e3659c", null, null),
													("65ccd9fe660cfe9914688665", "6158081ca3c0c1619d74088f", "65ccd764244249271dc194f4", "65ccd8a8faaa33b9b9f18568", null, null);
