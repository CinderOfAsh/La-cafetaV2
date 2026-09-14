-- Actualizar tags: anadir 'comida' a productos de comida
-- Actualizar imageUrl: asignar URLs de Unsplash
BEGIN TRANSACTION;

UPDATE Product SET tags = '["bebida", "caliente", "cafe"]', imageUrl = 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400' WHERE id = 'cmu1gvexz000w4txfanlyto4n';
UPDATE Product SET tags = '["bebida", "caliente", "cafe"]', imageUrl = 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400' WHERE id = 'cmu1gveye00124txfyqlpvkjk';
UPDATE Product SET tags = '["bebida", "caliente", "cafe"]', imageUrl = 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400' WHERE id = 'cmu1gvey7000z4txfqi74nt4l';
UPDATE Product SET tags = '["bebida", "caliente", "cafe"]', imageUrl = 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400' WHERE id = 'cmu1gveyq00154txf5io2r4l9';
UPDATE Product SET tags = '["bebida", "caliente", "cafe"]', imageUrl = 'https://images.unsplash.com/photo-1551030173-122aabc4489c?w=400' WHERE id = 'cmu1gvey5000y4txfjt2ic2ao';
UPDATE Product SET tags = '["bebida", "caliente", "cafe"]', imageUrl = 'https://images.unsplash.com/photo-1551030173-122aabc4489c?w=400' WHERE id = 'cmu1gveym00144txfoxhtikpt';
UPDATE Product SET tags = '["bebida", "caliente", "cafe"]', imageUrl = 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400' WHERE id = 'cmu1gvey2000x4txfqm121dsf';
UPDATE Product SET tags = '["bebida", "caliente", "cafe"]', imageUrl = 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400' WHERE id = 'cmu1gveyi00134txfkhnxiv4f';
UPDATE Product SET tags = '["bebida", "caliente", "frio", "dulce"]', imageUrl = 'https://images.unsplash.com/photo-1517578239113-b03992dcdd25?w=400' WHERE id = 'cmu1gvey900104txfx45ps0me';
UPDATE Product SET tags = '["bebida", "caliente", "frio", "dulce"]', imageUrl = 'https://images.unsplash.com/photo-1517578239113-b03992dcdd25?w=400' WHERE id = 'cmu1gveyb00114txfjdfza532';
UPDATE Product SET tags = '["bebida", "caliente"]', imageUrl = 'https://images.unsplash.com/photo-1571934811356-5cc061b6821f?w=400' WHERE id = 'cmu1gveyu00164txf6ah0lsqq';
UPDATE Product SET tags = '["bebida", "frio"]', imageUrl = 'https://images.unsplash.com/photo-1564419320461-6870880221ad?w=400' WHERE id = 'cmu1gveyy00174txfw06ck80c';
UPDATE Product SET tags = '["bebida", "refresco", "dulce", "frio"]', imageUrl = 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=400' WHERE id = 'cmu1gvez200184txf8fvo0bzb';
UPDATE Product SET tags = '["bebida", "refresco", "dulce", "frio"]', imageUrl = 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=400' WHERE id = 'cmu1gvez400194txfltb3k524';
UPDATE Product SET tags = '["bebida", "refresco", "dulce", "frio"]', imageUrl = 'https://images.unsplash.com/photo-1622543925917-763c34d1a86e?w=400' WHERE id = 'cmu1gvez7001a4txf4uy0ezoq';
UPDATE Product SET tags = '["bebida", "refresco", "dulce", "frio"]', imageUrl = 'https://images.unsplash.com/photo-1622543925917-763c34d1a86e?w=400' WHERE id = 'cmu1gveza001b4txfhmt2yvgs';
UPDATE Product SET tags = '["bebida", "refresco", "dulce", "frio"]', imageUrl = 'https://images.unsplash.com/photo-1622543925917-763c34d1a86e?w=400' WHERE id = 'cmu1gveze001c4txfgrekdph9';
UPDATE Product SET tags = '["bebida", "refresco", "agua bendita", "frio"]', imageUrl = 'https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=400' WHERE id = 'cmu1gvezg001d4txf7c0hj0gp';
UPDATE Product SET tags = '["bebida", "refresco", "dulce", "frio"]', imageUrl = 'https://images.unsplash.com/photo-1624552184280-9e9631bbeee9?w=400' WHERE id = 'cmu1gvezj001e4txf1eavpfom';
UPDATE Product SET tags = '["sof\u00eda", "bebida", "fria", "dulce"]', imageUrl = 'https://images.unsplash.com/photo-1437418747212-8d9709afab22?w=400' WHERE id = 'cmu1gvezn001f4txf4m08y8fo';
UPDATE Product SET tags = '["Sof\u00eda", "bebida", "fria", "dulce"]', imageUrl = 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400' WHERE id = 'cmu1gvezq001g4txfofijhu7p';
UPDATE Product SET tags = '["bocadillo", "caliente", "salado", "comida"]', imageUrl = 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400' WHERE id = 'cmu1gvewy000j4txfz194mbu1';
UPDATE Product SET tags = '["bocadillo", "dulce", "comida"]', imageUrl = 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=400' WHERE id = 'cmu1gvex1000k4txfgqde66qz';
UPDATE Product SET tags = '["bocadillo", "salado", "comida"]', imageUrl = 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=400' WHERE id = 'cmu1gvex3000l4txf2n4filil';
UPDATE Product SET tags = '["bocadillo", "salado", "comida"]', imageUrl = 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=400' WHERE id = 'cmu1gvex6000m4txfugvz5fju';
UPDATE Product SET tags = '["bocadillo", "salado", "comida"]', imageUrl = 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400' WHERE id = 'cmu1gvex9000n4txflt53ppb0';
UPDATE Product SET tags = '["Croissant", "dulce", "salado", "caliente", "comida"]', imageUrl = 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400' WHERE id = 'cmu1gvexd000o4txfrc1qc59w';
UPDATE Product SET tags = '["Croissant", "dulce", "salado", "comida"]', imageUrl = 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400' WHERE id = 'cmu1gvexr000t4txfly7d9nkr';
UPDATE Product SET tags = '["bocadillo", "salado", "comida"]', imageUrl = 'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=400' WHERE id = 'cmu1gvexg000p4txfa18gjjcg';
UPDATE Product SET tags = '["bocadillo", "salado", "comida"]', imageUrl = 'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=400' WHERE id = 'cmu1gvexj000q4txfxgp3t00x';
UPDATE Product SET tags = '["bocadillo", "salado", "comida"]', imageUrl = 'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=400' WHERE id = 'cmu1gvexm000r4txff1mp2ayf';
UPDATE Product SET tags = '["postre", "dulce", "comida"]', imageUrl = 'https://images.unsplash.com/photo-1562376552-0d160a2f238d?w=400' WHERE id = 'cmu1gvexp000s4txfi3ijayd2';
UPDATE Product SET tags = '["caliente", "bocadillo", "comida"]', imageUrl = 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400' WHERE id = 'cmu1gvexu000u4txfg6tef1z6';
UPDATE Product SET tags = '["frito", "cliente", "Jose_Adri_Aitana", "comida de ni\u00f1os", "comida"]', imageUrl = 'https://images.unsplash.com/photo-1531749668029-2db88e4276c7?w=400' WHERE id = 'cmu1gvexx000v4txfsdw5kb7n';
COMMIT;

-- Total: 37 productos actualizados