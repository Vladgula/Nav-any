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
        plan.object_by_id.set(object_id, object);
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
        // ориентиры, стыки, выходы, находящиеся на сторонах площадки
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


// Обработка XML-тега: <Orient>, <Room>, <Joint>, <Exit>
//     xml_node: узел соответствующего тега
// Возвращает объект [ orient | room | joint | exit ]
function read_object_on_side (xml_node)
{
    if (xml_node.tagName == "Orient" || xml_node.tagName == "Room"
        || xml_node.tagName == "Joint" || xml_node.tagName == "Exit")
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
            if (!(orient.wall == "left" || orient.wall == "right")) {
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
            if (!(room.wall == "left" || room.wall == "right")) {
                console.warn("Некорректное значение атрибута wall тега <Room>");
            }
            plan.orients.push(room);
            register_object_id(room.id, room);
            return room;
        }
        else if (xml_node.tagName == "Joint") {
            // TODO
        }
        else if (xml_node.tagName == "Exit") {
            // TODO
        }
    }
    else {
        console.warn("Ошибка: на стороне площадки неизвестный тег " + xml_child.tagName);
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
        object = read_object_on_side(xml_child);
        object.part_type = type;  // к объекту на стороне площадки добавляется атрибут part_type
        square.objects[dir].push(object);
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
                else {
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
    for (let child of xml_node.childNodes) {
        if (child.tagName == "Side") {
            // прочитать тег <Side>
            read_side(child, square);
        }
        else {
            // (?) ориентир может находиться прямо на площадке?
            console.warn("Посторонний тег внутри <Square>");
        }
    }

    return square;
}





// ЧТО ДЕЛАЕТ: читает ориентир <Orient> или <Room>. Возвращает объект и отправляет его в plan.orients

function read_orient (xml_node, square)
{
    let orient = {
        id: ("id" in xml_node.attributes ? xml_node.attributes["id"].nodeValue : ""),
        type: xml_node.tagName,    // Orient или Room
        name: ("name" in xml_node.attributes ? xml_node.attributes["name"].nodeValue : ""),
        text: ("text" in xml_node.attributes ? xml_node.attributes["text"].nodeValue : ""),
        no: ("no" in xml_node.attributes ? xml_node.attributes["no"].nodeValue : ""),
        key: ("key" in xml_node.attributes),
        wall: ("wall" in xml_node.attributes ? xml_node.attributes["wall"].nodeValue : ""),
        square_index: square.index,
    };

    // добавляем в общий список и в индекс
    plan.orients.push(orient);
    if (orient.id) plan.orient_by_id.set(orient.id, plan.orients.length - 1);
    return orient;
}

// ЧТО ДЕЛАЕТ: читает стык <Joint> или <Exit>. Складывает в plan.bounds

function read_bound (xml_node, square, side)
{
    let bound = {
        id: ("id" in xml_node.attributes ? xml_node.attributes["id"].nodeValue : ""),
        type: xml_node.tagName,  // Joint или Exit
        text: ("text" in xml_node.attributes ? xml_node.attributes["text"].nodeValue : ""),
        photo: ("photo" in xml_node.attributes ? xml_node.attributes["photo"].nodeValue : ""),
        square_id: square ? square.id : "",  // плохо! у наших площадок обычно нет id!
        square_index: square.index,
        side_dir: side ? side.dir : "",
        edges: []   // заполнит process_plan
    };

    plan.bounds.push(bound);
    if (bound.id) plan.bound_by_id.set(bound.id, plan.bounds.length - 1);

    // если это стык - добавим в joints_by_id
    if (bound.type == "Joint") {
        if (!plan.joints_by_id.has(bound.id)) {
            plan.joints_by_id.set(bound.id, Array());
        }
        plan.joints_by_id.get(bound.id).push(plan.bounds.length - 1);
    }

    // если это выход — продублируем в exits
    if (bound.type == "Exit") plan.exits.push(bound);

    return bound;
}

// ЧТО ДЕЛАЕТ: читает <Corridor> — коридор. У него есть start, finish, finish_text, finish_photo, floor, building

function read_corridor (xml_node, floor_num, block_id)
{
    let corridor = {
        id: ("id" in xml_node.attributes ? xml_node.attributes["id"].nodeValue : ""),
        start: ("start" in xml_node.attributes ? xml_node.attributes["start"].nodeValue : ""),
        finish: ("finish" in xml_node.attributes ? xml_node.attributes["finish"].nodeValue : ""),
        finish_text: ("finish_text" in xml_node.attributes ? xml_node.attributes["finish_text"].nodeValue : ""),
        finish_photo: ("finish_photo" in xml_node.attributes ? xml_node.attributes["finish_photo"].nodeValue : ""),
        floor: floor_num,
        block_id: block_id,
        orients: [],
        edges: []
    };

    // внутри коридора — ориентиры с атрибутом wall (left/right)
    for (let child of xml_node.childNodes) {
        if (child.tagName == "Orient" || child.tagName == "Room") {
            corridor.orients.push(read_orient(child, null));  // TODO: исправить! соединить ребрами коридоры с ориентирами и стыками! передать в read_orient коридор!
        }
    }

    plan.corridors.push(corridor);
    if (corridor.id) plan.corridor_by_id.set(corridor.id, plan.corridors.length - 1);
    return corridor;
}

// ЧТО ДЕЛАЕТ: читает <Stairs> — лестницу. У неё floor_down, floor_up, text_up, text_down

function read_stairs (xml_node)
{
    let stairs = {
        id: ("id" in xml_node.attributes ? xml_node.attributes["id"].nodeValue : ""),
        floor_down: ("floor_down" in xml_node.attributes ? parseInt(xml_node.attributes["floor_down"].nodeValue) : 0),
        floor_up: ("floor_up" in xml_node.attributes ? parseInt(xml_node.attributes["floor_up"].nodeValue) : 0),
        building: ("building" in xml_node.attributes ? parseInt(xml_node.attributes["building"].nodeValue) : 0),
        text_up: ("text_up" in xml_node.attributes ? xml_node.attributes["text_up"].nodeValue : ""),
        text_down: ("text_down" in xml_node.attributes ? xml_node.attributes["text_down"].nodeValue : "")
    };

    plan.stairs.push(stairs);
    if (stairs.id) plan.stairs_by_id.set(stairs.id, plan.stairs.length - 1);
    return stairs;
}

// ЧТО ДЕЛАЕТ: выносим логику чтения <Category> из read_plan в отдельную функцию

function read_category (xml_node)
{
    let category_id = xml_node.attributes["id"].nodeValue;
    let category_name = xml_node.attributes["name"].nodeValue;
    let category = {
        id: category_id,
        name: category_name,
        points: []    // заполнится позже, когда ориентиры будут добавляться
    };
    plan.categories.push(category);
    plan.category_by_id.set(category_id, plan.categories.length - 1);
}

// Финальная функция
// ЧТО ДЕЛАЕТ: корневой цикл. Вместо <Floor> внутри <Plan> теперь <Block> (отсек = этаж + корпус), 
// внутри — <Square>, <Corridor>, <Stairs>. <Exit> и <Card> и <Category> — на уровне <Plan>.

function read_plan ()
{
    let xml_plan = xmlDoc.getElementsByTagName("Plan")[0];
    if (!xml_plan) { alert("Нет корневого тега <Plan>"); return; }

    // <Plan> содержит <Building> и (опционально) <Card>/<Category>/<Exit>
    for (let plan_child of xml_plan.childNodes) {

        if (plan_child.tagName == "Building") {
            // внутри <Building> — <Block> (отсеки/этажи)
            for (let building_child of plan_child.childNodes) {

                if (building_child.tagName == "Block") {
                    let floor_num = ("floor" in building_child.attributes
                        ? parseInt(building_child.attributes["floor"].nodeValue) : 0);
                    let block_id = ("id" in building_child.attributes
                        ? building_child.attributes["id"].nodeValue : "");

                    // регистрируем отсек в plan.blocks
                    plan.blocks.push({ id: block_id, floor: floor_num });
                    if (block_id) plan.block_by_id.set(block_id, plan.blocks.length - 1);

                    // проходим по детям отсека: Square / Corridor / Stairs
                    for (let block_child of building_child.childNodes) {
                        if (block_child.tagName == "Square") {
                            read_square(block_child, floor_num, block_id);
                        }
                        else if (block_child.tagName == "Corridor") {
                            read_corridor(block_child, floor_num, block_id);
                        }
                        else if (block_child.tagName == "Stairs") {
                            read_stairs(block_child);
                        }
                    }
                }
            }
        }
        // <Exit> — выход (на уровне всего здания) — пока у тебя нет, но пусть будет
        else if (plan_child.tagName == "Exit") {
            read_bound(plan_child, null, null);
        }
        // <Card> — карточка ориентира
        else if (plan_child.tagName == "Card") {
            let point_id = plan_child.attributes["point"].nodeValue;
            plan.cards.set(point_id, plan_child.innerHTML);
        }
        // <Category> — категория ориентиров
        else if (plan_child.tagName == "Category") {
            read_category(plan_child);
        }
    }
}

read_plan();

console.log("=== read_plan: plan ===", plan);   // отладка
