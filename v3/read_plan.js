// преобразуем строку с XML-файлом в дерево XML-документа
// строка planXML должна быть определена
let xmlDoc;
if (window.DOMParser)
{
    let parser = new DOMParser();
    xmlDoc = parser.parseFromString(planXML, "text/xml");
}
else  // Internet Explorer
{
    xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
    xmlDoc.async = false;
    xmlDoc.loadXML(planXML);
}


/*
    Структура данных "План здания":
    - Площадки, Коридоры, Лестницы [ стороны площадок, части сторон площадок ]
    - Ориентиры, Комнаты
    - Стыки, Выходы
*/

let plan = {
    // разновидности площадок
    squares: [],          // площадки (площадки, коридоры, лестницы)
    corridors: [],        // коридоры
    stairs: [],           // лестницы
    // разновидности ориентиров
    orients: [],          // ориентиры
    // разновидности стыков
    joints: [],           // стыки (<Joint>)
    exits: [],            // выходы (<Exit>)
    // корпуса
    buildings: [],
    // этажи
    floors: [],

    // ассоциативный массив: строковый id -> объект
    object_by_id: new Map(),
    // ассоциативный массив: строковый id -> массив стыков
    joints_by_id: new Map(),
    // TODO: добавить отдельный ассоциативный массив exists_by_id для хранения выходов

    // дополнительная информация, добавляемая модулем process_plan.js
    //vertices: [],         // вершины графа (площадки, стыки, ориентиры)
    //edges: []             // двумерный массив - списки смежности графа
};


// Добавляет id объекта в ассоциативный массив object_by_id
function register_object_id (object_id, object)
{
    if (object_id) {  // если object_id не пуст
        if (plan.object_by_id.has(object_id))
            alert(`Дублирование id ${object_id}`);
        if (object.obj_type != "joint") {  // если это не стык
            plan.object_by_id.set(object_id, object);
        }
        else {  // object.obj_type == "joint"
            if (!plan.joints_by_id.has(object_id)) {
                // такого id стыка в базе нет => присвоить пустой массив списку стыков с этим id
                plan.joints_by_id.set(object_id, Array());
            }
            plan.joints_by_id.get(object_id).push(object);
        }
    }
}


// Создает новую площадку (добавляет её в массив площадок, регистрирует id площадки)
function new_square (square_id, building, floor)
{
    let square = {
        obj_type: "square",
        id: square_id,
        name: "",
        building: building,
        floor: floor,
        // ориентиры и стыки, находящиеся на сторонах площадки
        //   (ориентиры на каждой стороне перечисляются в порядке обхода против часовой стрелки)
        objects: new Map([["right", []], ["forward", []], ["left", []], ["backward", []]]),
        //vertex_index: null,     // индекс в массиве вершин графа (см. process_plan.js)
        // index: plan.squares.length,
        edges: [],  // список смежных объектов в графе (см. process_plan.js)
    };
    plan.squares.push(square);
    register_object_id(square_id, square);
    return square;
}


// Обработка XML-тега: <Orient>, <Room>, <Joint>
//     xml_node: узел соответствующего тега
// Возвращает объект [ orient | room | joint ]
function read_object_on_side (xml_node)
{
    if (xml_node.tagName == "Orient" || xml_node.tagName == "Room"
        || xml_node.tagName == "Joint")
    {
        if (xml_node.tagName == "Orient") {
            let orient = {
                id: ("id" in xml_node.attributes ? xml_node.attributes["id"].nodeValue : ""),
                obj_type: "orient",
                name: ("name" in xml_node.attributes ? xml_node.attributes["name"].nodeValue : ""),
                text: ("text" in xml_node.attributes ? xml_node.attributes["text"].nodeValue : ""),
                //no: ("no" in xml_node.attributes ? xml_node.attributes["no"].nodeValue : ""),
                key: ("key" in xml_node.attributes),
                wall: ("wall" in xml_node.attributes ? xml_node.attributes["wall"].nodeValue : ""),
                edges: [],  // список смежных объектов в графе (см. process_plan.js)
            };
            if (orient.wall && !(orient.wall == "left" || orient.wall == "right")) {
                console.warn("Некорректное значение атрибута wall тега <Orient>");
            }
            plan.orients.push(orient);
            register_object_id(orient.id, orient);
            return orient;
        }
        else if (xml_node.tagName == "Room") {
            let room = {
                // (?) если id не указан, задействовать номер комнаты?
                id: ("id" in xml_node.attributes ? xml_node.attributes["id"].nodeValue : ""),
                obj_type: "room",
                name: ("name" in xml_node.attributes ? xml_node.attributes["name"].nodeValue : ""),
                text: ("text" in xml_node.attributes ? xml_node.attributes["text"].nodeValue : ""),
                no: ("no" in xml_node.attributes ? xml_node.attributes["no"].nodeValue : ""),
                key: ("key" in xml_node.attributes),
                wall: ("wall" in xml_node.attributes ? xml_node.attributes["wall"].nodeValue : ""),
                edges: [],  // список смежных объектов в графе (см. process_plan.js)
            };
            if (room.wall && !(room.wall == "left" || room.wall == "right")) {
                console.warn("Некорректное значение атрибута wall тега <Room>");
            }
            plan.orients.push(room);
            register_object_id(room.id, room);
            return room;
        }
        else if (xml_node.tagName == "Joint") {
            let joint = {
                id: ("id" in xml_node.attributes ? xml_node.attributes["id"].nodeValue : ""),
                obj_type: "joint",
                text: ("text" in xml_node.attributes ? xml_node.attributes["text"].nodeValue : ""),
                photo: ("photo" in xml_node.attributes ? xml_node.attributes["photo"].nodeValue : ""),
                edges: [],  // список смежных объектов в графе (см. process_plan.js)
            };
            if (!joint.id) {
                alert(`Пустой id у тега <Joint>`);
            }
            plan.joints.push(joint);
            register_object_id(joint.id, joint);
            return joint;
        }
    }
    else if (xml_node.nodeType == 1) {
        console.warn("Ошибка: на стороне площадки неизвестный тег " + xml_node.tagName);
        return null;
    }
}


// Обработка XML-тега <Part> либо тега <Side>, внутри которого нет <Part>
//     xml_node: узел тега <Part>
//     square: площадка
//     dir: направление стороны площадки
//     type: тип границы ("wall" | "window" | "free")
// Добавляет к площадке ориентиры, расположенные на данной стороне
function read_part (xml_node, square, dir, type)
{
    // в тег <Part> вложены теги <Orient>, <Room>, <Joint>, <Exit>
    for (let xml_child of xml_node.childNodes) {
        if (xml_child.nodeType != 1) continue;  // если это не тег => продолжить
        let object = read_object_on_side(xml_child);
        object.parent_square = square;  // ссылка на площадку, на стороне которой находится объект
        object.part_type = type;  // к объекту на стороне площадки добавляется атрибут part_type
        square.objects.get(dir).push(object);
    }
}


// Обработка XML-тега <Side>
//     xml_node: узел тега <Side>
//     square: площадка
// Добавляет к площадке ориентиры, расположенные на данной стороне
function read_side (xml_node, square)
{
    // проверка наличия атрибута dir у тега <Side>
    if (!("dir" in xml_node.attributes)) {
        console.warn("Ошибка: у <Side> нет атрибута dir");
        return;
    }
    let dir = xml_node.attributes["dir"].nodeValue;  // направление стороны площадки

    // если у тега <Side> есть вложенные теги, обработать их
    if (xml_node.children.length > 0) {
        // если первый вложенный тег - <Part>, обработать последовательность тегов <Part>
        if (xml_node.children[0].tagName == "Part") {
            for (let xml_child of xml_node.childNodes) {
                if (xml_child.tagName == "Part") {
                    part_type = "type" in xml_child.attributes ? xml_child.attributes["type"].nodeValue : null;
                    read_part(xml_child, square, dir, part_type);
                }
                else if (xml_child.nodeType == 1) {
                    console.warn("Посторонний тег внутри <Side>, где есть <Part>");
                }
            }
        }
        // если первый вложенный тег - не <Part>, то сторона площадки не разделена на части;
        //   прочитать ориентиры и стыки, вложенные в тег <Side>
        else {
            // тип стороны площадки по умолчанию - "free"
            side_type = "type" in xml_node.attributes ? xml_node.attributes["type"].nodeValue : "free";
            read_part(xml_node, square, dir, side_type);
        }
    }
}


// Обработка XML-тега <Square>
//     xml_node: узел тега <Square>
//     building: корпус
//     floor: этаж
function read_square (xml_node, building, floor)
{
    let square_id = "id" in xml_node.attributes ? xml_node.attributes["id"].nodeValue : "";
    let square = new_square(square_id, building, floor);

    // перечислить все вложенные теги
    for (let xml_child of xml_node.childNodes) {
        if (xml_child.tagName == "Side") {
            // прочитать тег <Side>
            read_side(xml_child, square);
        }
        else if (xml_child.nodeType == 1) {
            // (?) ориентир может находиться прямо на площадке?
            console.warn("Посторонний тег внутри <Square>");
        }
    }

    return square;
}


// Создает новый коридор (добавляет его в массив коридоров, регистрирует id коридора)
function new_corridor (corridor_id, building, floor, start_id, finish_id)
{
    let corridor = {
        obj_type: "corridor",
        id: corridor_id,
        name: "",
        building: building,
        floor: floor,
        // id стыка, с которого начинается коридор
        start_id: start_id,
        // id стыка, на котором заканчивается коридор
        finish_id: finish_id,
        // ориентиры и стыки, находящиеся вдоль стенок коридора
        //   (ориентиры перечисляются в порядке движения от начала до конца коридора)
        objects: [],
        edges: [],  // список смежных объектов в графе (см. process_plan.js)
    };
    plan.corridors.push(corridor);
    register_object_id(corridor_id, corridor);
    return corridor;
}


// Обработка XML-тега <Corridor>
//     xml_node: узел тега <Corridor>
//     building: корпус
//     floor: этаж
function read_corridor (xml_node, building, floor)
{
    let corridor_id = "id" in xml_node.attributes ? xml_node.attributes["id"].nodeValue : "";
    let start_id = "start" in xml_node.attributes ? xml_node.attributes["start"].nodeValue : "";
    let finish_id = "finish" in xml_node.attributes ? xml_node.attributes["finish"].nodeValue : "";
    let corridor = new_corridor(corridor_id, building, floor, start_id, finish_id);
    corridor.finish_text = "finish_text" in xml_node.attributes ? xml_node.attributes["finish_text"].nodeValue : "";
    corridor.finish_photo = "finish_photo" in xml_node.attributes ? xml_node.attributes["finish_photo"].nodeValue : "";

    // (TODO?) возможность добавить в тег <Corridor> вложенный тег <Part>,
    //   чтобы указать тип границы (не стенка, а свободное пространство или окно);
    // тогда можно будет на стенках коридора указывать стыки
    
    // Дальше - по аналогии с read_part
    // в тег <Corridor> вложены теги <Orient>, <Room>
    // перечислить все вложенные теги
    for (let xml_child of xml_node.childNodes) {
        if (xml_child.nodeType != 1) continue;  // если это не тег => продолжить
        let object = read_object_on_side(xml_child);
        object.parent_square = corridor;  // ссылка на площадку, на стороне которой находится объект
        object.part_type = "wall";  // см. TODO (выше)
        corridor.objects.push(object);
    }

    return corridor;
}


// Создает новую лестницу (добавляет её в массив лестниц, регистрирует id лестницы)
function new_stairs (stairs_id, start_id, finish_id)
{
    let stairs = {
        obj_type: "stairs",
        id: stairs_id,
        name: "",
        // id стыка, с которого начинается лестница
        start_id: start_id,
        // id стыка, на котором заканчивается лестница
        finish_id: finish_id,
        // ориентиры и стыки, находящиеся по сторонам лестницы
        //   (ориентиры перечисляются в порядке движения от начала до конца лестницы)
        objects: [],
        edges: [],  // список смежных объектов в графе (см. process_plan.js)
    };
    // (TODO?) заполнить у объекта stairs поля start_building, start_floor, finish_building, finish_floor
    plan.stairs.push(stairs);
    register_object_id(stairs_id, stairs);
    return stairs;
}


// Обработка XML-тега <Stairs>
//     xml_node: узел тега <Stairs>
// (?) узкое место: откуда брать атрибуты building и floor у объекта "stairs"? => обратиться к соответствующим стыкам
function read_stairs (xml_node)
{
    let stairs_id = "id" in xml_node.attributes ? xml_node.attributes["id"].nodeValue : "";
    let start_id = "start" in xml_node.attributes ? xml_node.attributes["start"].nodeValue : "";
    let finish_id = "finish" in xml_node.attributes ? xml_node.attributes["finish"].nodeValue : "";
    let stairs = new_stairs(stairs_id, start_id, finish_id);
    // (TODO?) заполнить другие поля объекта stairs - например, text_start, text_finish?
    
    // Дальше - по аналогии с read_part
    // в тег <Stairs> могут быть вложены теги <Orient>
    // перечислить все вложенные теги
    for (let xml_child of xml_node.childNodes) {
        if (xml_child.nodeType != 1) continue;  // если это не тег => продолжить
        let object = read_object_on_side(xml_child);
        object.parent_square = stairs;  // ссылка на площадку, на стороне которой находится объект
        object.part_type = "wall";  // см. TODO (выше)
        stairs.objects.push(object);
    }

    return stairs;
}


// Обработка XML-тега <Block>
//     xml_node: узел тега <Block>
//     building: корпус
//     floor: этаж
function read_block (xml_node, building, floor)
{
    // TODO: если вложенный тег - <Block>, читаем все вложенные блоки;
    //   если вложенный тег - <Square>/<Corridor>/<Stairs>, читаем все вложенные площадки/коридоры/лестницы
    
    // Обновить значения атрибутов building, floor, если они переопределяются во вложенном теге <Block>
    let new_building = building;
    let new_floor = floor;
    if ("building" in xml_node.attributes) {
        new_building = xml_node.attributes["building"].nodeValue;
    }
    if ("floor" in xml_node.attributes) {
        new_floor = xml_node.attributes["floor"].nodeValue;
    }

    if (xml_node.children.length > 0) {
        // если первый вложенный тег - <Block>, прочитать все вложенные теги <Block>
        if (xml_node.children[0].tagName == "Block") {
            for (let xml_child of xml_node.childNodes) {
                if (xml_child.tagName == "Block") {
                    read_block(xml_child, new_building, new_floor);
                }
                else if (xml_child.nodeType == 1) {
                    console.warn("Посторонний тег внутри <Block>, где есть вложенный тег <Block>");
                }
            }
        }
        // если вложенный тег - <Square>/<Corridor>/<Stairs>, прочитать все вложенные площадки/коридоры/лестницы
        else {
            for (let xml_child of xml_node.childNodes) {
                if (xml_child.tagName == "Square") {
                    read_square(xml_child, new_building, new_floor);
                }
                else if (xml_child.tagName == "Corridor") {
                    read_corridor(xml_child, new_building, new_floor);
                }
                else if (xml_child.tagName == "Stairs") {
                    read_stairs(xml_child);
                }
                else if (xml_child.nodeType == 1) {
                    console.warn(`Посторонний тег внутри <Block>, где есть вложенные теги типа "площадка"`);
                }
            }            
        }
    }
}


// Обработка XML-тега <Exit>
//     xml_node: узел тега <Part>
// (?) узкое место: откуда брать атрибуты building и floor у объекта "exit"? => обратиться к соответствующим стыкам
function read_exit(xml_node)
{
    let exit = {
        id: ("id" in xml_node.attributes ? xml_node.attributes["id"].nodeValue : ""),
        obj_type: "exit",
        text: ("text" in xml_node.attributes ? xml_node.attributes["text"].nodeValue : ""),
        photo: ("photo" in xml_node.attributes ? xml_node.attributes["photo"].nodeValue : ""),
        edges: [],  // список смежных объектов в графе (см. process_plan.js)
    };
    if (!exit.id) {
        alert(`Пустой id у тега <Exit>`);
    }
    plan.exits.push(exit);
    register_object_id(exit.id, exit);
    return exit;
}


// Обработка XML-файла
function read_plan ()
{
    let xml_plan = xmlDoc.getElementsByTagName("Plan")[0];
    if (!xml_plan) { alert("Нет корневого тега <Plan>"); return; }

    // <Plan> содержит <Block>, <Exit>
    // TODO: добавить теги <Building>, <Floor> - для регистрации корпусов и номеров этажей
    for (let plan_child of xml_plan.childNodes) {
        if (plan_child.tagName == "Block") {
            read_block(plan_child);
        }
        else if (plan_child.tagName == "Exit") {
            read_exit(plan_child);
        }
        else if (plan_child.nodeType == 1) {
            console.warn("Ошибка: внутри <Plan> неизвестный тег " + plan_child.tagName);
        }
    }
}

read_plan();

console.log("=== read_plan: plan ===", plan);   // отладка
