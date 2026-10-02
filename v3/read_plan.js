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
    xmlDoc.loadXML(txt);
}

/*
    Структура данных "План здания":
       points - массив пунктов (пункт: этаж, id, название, тип пункта, массив ребер)
       paths - массив путей перемещения (путь: тип пути, направление перемещения, массив пунктов в пути)
       point_by_id - ассоциативный массив (ключ - строковый id, значение - индекс пункта)
*/
let plan = {
    squares: [],          // массив площадок (квадратов/коридоров/лестниц)
    bounds: [],           // массив стыков (<Joint> и <Exit>)
    orients: [],          // все ориентиры одним плоским списком
    corridors: [],        // массив коридоров (они длиннее площадок)
    stairs: [],           // массив лестниц
    exits: [],            // массив выходов из здания
    blocks: [],           // массив отсеков (этаж + корпус)

    // ассоциативные массивы: строковый id -> индекс в массиве
    square_by_id: new Map(),
    bound_by_id: new Map(),
    orient_by_id: new Map(),
    corridor_by_id: new Map(),
    stairs_by_id: new Map(),
    block_by_id: new Map(),

    cards: new Map(),         // карточки (текст для ориентира)
    categories: [],           // категории ориентиров
    category_by_id: new Map()
};


const motionDir = ["up", "right", "down", "left"]; //направления сторон
const motionDirForStr = str => {
    return motionDir.indexOf(str);
}

function get_stairs_point_id (point_id, floor) //генерация id для лестниц (пригодятся, если понадобится совместимость)
{
    return point_id + "_stairs_" + String(floor);
}

function get_elevator_point_id (point_id, floor) //генерация id для лифтов
{
    return point_id + "_elevator_" + String(floor);
}

// Что ДЕЛАЕТ: Читает тег <Square> — площадку. Внутри перебирает <Side dir="..."> (стороны), а внутри каждой стороны <Part> или сразу <Orient>
// Логика:
//Ищем <Side> внутри <Square>
//Если у <Side> нет атрибута dir — пишем ошибку (в консоль или alert)
//Если dir есть — сохраняем в side.dir
//Если первый ребёнок <Side> — <Part>, читаем все Part через read_part
//Если первый ребёнок — не <Part>, читаем всех детей как ориентиры через read_orient

function read_square (xml_node, floor_num, block_id)
{
    // создаём объект площадки
    let square = {
        id: ("id" in xml_node.attributes ? xml_node.attributes["id"].nodeValue : ""),
        name: ("name" in xml_node.attributes ? xml_node.attributes["name"].nodeValue : ""),
        floor: floor_num,
        block_id: block_id,
        sides: [],       // массив сторон (forward/left/right/backward)
        orients: [],     // ориентиры, лежащие прямо на площадке (вне Side)
        edges: []        // список смежности (заполнит process_plan)
    };

    // перебираем всех детей <Square>
    for (let child of xml_node.childNodes) {
        if (child.tagName == "Side") {
            // читаем сторону
            let side = read_side(child, square);
            if (side) square.sides.push(side);
        }
        else if (child.tagName == "Orient" || child.tagName == "Room") {
            // ориентир прямо на площадке (без Side)
            let orient = read_orient(child);
            square.orients.push(orient);
        }
        else if (child.tagName == "Joint" || child.tagName == "Exit") {
            // стык/выход прямо на площадке
            read_bound(child, square, null);
        }
    }

    // добавляем площадку в plan и в индекс по id
    plan.squares.push(square);
    if (square.id) plan.square_by_id.set(square.id, plan.squares.length - 1);
    return square;
}

// ЧТО ДЕЛАЕТ: читает одну сторону <Side> площадки. Проверяет наличие dir. Внутри читает <Part> или <Orient>

function read_side (xml_node, square)
{
    // проверяем, есть ли атрибут dir — без него сторона бессмысленна
    if (!("dir" in xml_node.attributes)) {
        console.warn("Ошибка: у <Side> нет атрибута dir");
        return null;
    }
    let dir = xml_node.attributes["dir"].nodeValue;

    // объект стороны
    let side = {
        dir: dir,        // forward / left / right / backward
        parts: [],       // части стороны
        orients: []      // ориентиры, лежащие прямо на стороне
    };

    // если у стороны есть дети — читаем их
    if (xml_node.children.length > 0) {
        // если первый ребёнок — Part, читаем все Part
        if (xml_node.children[0].tagName == "Part") {
            for (let child of xml_node.childNodes) {
                if (child.tagName == "Part") {
                    side.parts.push(read_part(child, square));
                }
            }
        }
        else {
            // иначе — читаем всех детей как ориентиры
            for (let child of xml_node.childNodes) {
                if (child.tagName == "Orient" || child.tagName == "Room") {
                    side.orients.push(read_orient(child));
                }
                else if (child.tagName == "Joint" || child.tagName == "Exit") {
                    read_bound(child, square, side);
                }
            }
        }
    }

    return side;
}

// ЧТО ДЕЛАЕТ: читает <Part type="wall|window|free">. Внутри — ориентиры

function read_part (xml_node, square)
{
    let part = {
        type: ("type" in xml_node.attributes ? xml_node.attributes["type"].nodeValue : "free"),
        orients: []       // ориентиры внутри этой части
    };

    // внутри Part могут быть Orient/Room/Joint
    for (let child of xml_node.childNodes) {
        if (child.tagName == "Orient" || child.tagName == "Room") {
            part.orients.push(read_orient(child));
        }
        else if (child.tagName == "Joint" || child.tagName == "Exit") {
            read_bound(child, square, null);
        }
    }

    return part;
}

// ЧТО ДЕЛАЕТ: читает ориентир <Orient> или <Room>. Возвращает объект и отправляет его в plan.orients

function read_orient (xml_node)
{
    let orient = {
        id: ("id" in xml_node.attributes ? xml_node.attributes["id"].nodeValue : ""),
        type: xml_node.tagName,    // Orient или Room
        name: ("name" in xml_node.attributes ? xml_node.attributes["name"].nodeValue : ""),
        text: ("text" in xml_node.attributes ? xml_node.attributes["text"].nodeValue : ""),
        no: ("no" in xml_node.attributes ? xml_node.attributes["no"].nodeValue : ""),
        key: ("key" in xml_node.attributes),
        wall: ("wall" in xml_node.attributes ? xml_node.attributes["wall"].nodeValue : "")
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
        square_id: square ? square.id : "",
        side_dir: side ? side.dir : "",
        edges: []   // заполнит process_plan
    };

    plan.bounds.push(bound);
    if (bound.id) plan.bound_by_id.set(bound.id, plan.bounds.length - 1);

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
            corridor.orients.push(read_orient(child));
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
