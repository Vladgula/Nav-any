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
    points: [],
    paths: [],
    point_by_id: new Map(),
    stairs_by_id: new Map(),
    elevator_by_id: new Map(),
    cards: new Map(),
    categories: [],
    category_by_id: new Map()
};

const motionDir = ["up", "right", "down", "left"];

const motionDirForStr = str => {
    return motionDir.indexOf(str);
}

function get_stairs_point_id (point_id, floor)
{
    return point_id + "_stairs_" + String(floor);
}

function get_elevator_point_id (point_id, floor)
{
    return point_id + "_elevator_" + String(floor);
}

// находит пункт по идентификатору, указанному во входном файле
function get_point_by_id (point_id, floor)
{
    stairs_point_id = get_stairs_point_id(point_id, floor);
    elevator_point_id = get_elevator_point_id(point_id, floor);
    let point_index;
    if (plan.point_by_id.has(stairs_point_id))
        point_index = plan.point_by_id.get(stairs_point_id);
    else if (plan.point_by_id.has(stairs_point_id))
        point_index = plan.point_by_id.get(elevator_point_id);
    else
        point_index = plan.point_by_id.get(point_id);
    if (point_index == undefined) { alert("Ошибка: пункт с id " + point_id + " на этаже " + floor + " не найден!"); }
    return point_index;
}

// добавляет пункт к плану
// возвращает индекс пункта
function add_point (point)
{
    plan.points.push(point);
    let point_index = plan.points.length - 1;
    plan.point_by_id.set(point.id, point_index);
    
    if (point.cat) {
        //console.log(plan.category_by_id.get(point.cat));
        let category_index = plan.category_by_id.get(point.cat);
        //console.log(point.cat);
        //console.log(category_index);
        plan.categories[category_index].points.push(point_index);
    }

    return point_index;
}

// добавляет пункт к пути
function add_point_to_path (point_index, path_index)
{
    plan.paths[path_index].path_points.push(point_index);
}

// обрабатывает узел xml-дерева с пунктом
function process_xml_node (xml_node, path_index, floor_num)
{
    let point = {
        floor: floor_num,
        id: ("id" in xml_node.attributes ? xml_node.attributes["id"].nodeValue : ""),
        name: ("name" in xml_node.attributes ? xml_node.attributes["name"].nodeValue : ""),
        type: "",
        wall: ("wall" in xml_node.attributes ? xml_node.attributes["wall"].nodeValue : ""),
        hidden: false,  //(xml_node.attributes["show_name"] != "1"),
        edges: [],
        to: ("to" in xml_node.attributes ? xml_node.attributes["to"].nodeValue : ""),
        fav: ("fav" in xml_node.attributes),
        cat: ("cat" in xml_node.attributes ? xml_node.attributes["cat"].nodeValue : "")
    };    
    // добавляем новый пункт
    let point_index;
    if (point.id && plan.point_by_id.has(point.id)) {  // если пункт с таким id уже есть
        point_index = get_point_by_id(point.id, floor_num);        
    }
    else {
        let node_tag = xml_node.tagName;
        point.type = node_tag;
        if (node_tag == "Point") {
            point_index = add_point(point);
        }
        else if (node_tag == "Room") {
            if (point.name == "")
                point.name = point.id;
            point.hidden = false;
            point_index = add_point(point);
        }
        else if (node_tag == "Stairs") {
            let stairs_id = point.id;
            let stairs_point_id = get_stairs_point_id(stairs_id, floor_num);
            point.id = stairs_point_id;
            point.name = "Лестница";
            point.hidden = false;
            point_index = add_point(point);
            if (!plan.stairs_by_id.has(stairs_id))
                plan.stairs_by_id.set(stairs_id, []);
            plan.stairs_by_id.get(stairs_id).push(point_index);
        } 
        else if (node_tag == "Elevator") {
            let elevator_id = point.id;
            let elevator_point_id = get_elevator_point_id(elevator_id, floor_num);
            point.id = elevator_point_id;
            point.name = "Лифт";
            point.hidden = false;
            point_index = add_point(point);
            if (!plan.elevator_by_id.has(elevator_id))
                plan.elevator_by_id.set(elevator_id, []);
            plan.elevator_by_id.get(elevator_id).push(point_index);
        }
        else if (node_tag == "Wall") {
            point_index = add_point(point);
        }
        else if (node_tag == "Door") {
            point_index = add_point(point);
        }
        else if (node_tag == "Toilet") {
            point_index = add_point(point);
        }
        else if (node_tag == "Joint") {
            point_index = add_point(point);            
            point.path = path_index;
            if ("text_forward" in xml_node.attributes)
                point.text_forward = xml_node.attributes["text_forward"].nodeValue;
            if ("text_backward" in xml_node.attributes)
                point.text_backward = xml_node.attributes["text_backward"].nodeValue;
            if ("text_left" in xml_node.attributes)
                point.text_left = xml_node.attributes["text_left"].nodeValue;
            if ("text_right" in xml_node.attributes)
                point.text_right = xml_node.attributes["text_right"].nodeValue;

            if ("photo_forward" in xml_node.attributes)
                point.photo_forward = xml_node.attributes["photo_forward"].nodeValue;
            if ("photo_backward" in xml_node.attributes)
                point.photo_backward = xml_node.attributes["photo_backward"].nodeValue;
            if ("photo_left" in xml_node.attributes)
                point.photo_left = xml_node.attributes["photo_left"].nodeValue;
            if ("photo_right" in xml_node.attributes)
                point.photo_right = xml_node.attributes["photo_right"].nodeValue;
        }
        else {
            alert(node_tag);
        }
    }
    // добавляем пункт к пути
    if (path_index != -1)
        add_point_to_path(point_index, path_index);
}

// возвращает номер направления после поворота
function rotate_dir (dir, rotate_str)
{
    let new_dir;
    if (rotate_str == "forward")
        new_dir = dir;
    else if (rotate_str == "left")
        new_dir = (dir + 3) % 4;
    else if (rotate_str == "right")
        new_dir = (dir + 1) % 4;
    else if (rotate_str == "back")
        new_dir = (dir + 2) % 4;
    return new_dir;
}

// преобразует информацию о пути из xml в нашу СД
function read_path (xml_node, path_index, floor_num)
{
    for (node_child of xml_node.childNodes) {
        if (node_child.tagName == "Path") {
            // обрабатываем путь перемещения
            // let point_index = get_point_by_id(node_child.attributes["start"].nodeValue, floor_num);
            // в качестве стартового пункта пути -- пункт родительского пути перед новым путем
            let point_index = plan.paths[path_index].path_points[plan.paths[path_index].path_points.length - 1];
            let rotate_str = node_child.attributes["rotate"].nodeValue;
            let parent_path_dir = plan.paths[path_index].dir;
            let dir = rotate_dir(parent_path_dir, rotate_str);
            let path = {
                walls: ("walls" in node_child.attributes ? node_child.attributes["walls"].nodeValue : "no"),
                dir: dir, 
                path_points: [point_index],
            };

            if ("scheme_text_backward" in node_child.attributes)
                path.scheme_text_backward = node_child.attributes["scheme_text_backward"].nodeValue;
            if ("scheme_text_forward" in node_child.attributes)
                path.scheme_text_forward = node_child.attributes["scheme_text_forward"].nodeValue;

            if ("scheme_photo" in node_child.attributes)
                path.scheme_photo = node_child.attributes["scheme_photo"].nodeValue;
    
            // добавляем путь
            plan.paths.push(path);
            let new_path_index = plan.paths.length - 1;
            // читаем путь, внутренний по отношению к текущему пути
            read_path(node_child, new_path_index, floor_num);
        }   
        else if (node_child.tagName)
            process_xml_node(node_child, path_index, floor_num);
    }
}

// строит структуру данных "План здания"
function read_plan ()
{
    // TODO: добавить обработку ошибок во входном файле
    let root = xmlDoc.getElementsByTagName("Plan")[0];
    for (const plan_child of root.childNodes) {
        if (plan_child.tagName == "Exit") {
            // добавляем пункт типа "Выход"
            let point_exit = {
                floor: parseInt(plan_child.attributes["floor"].nodeValue),
                id: plan_child.attributes["id"].nodeValue,
                name: ("name" in plan_child.attributes ? plan_child.attributes["name"].nodeValue : "Выход"),
                type: "Exit",
                hidden: false,
                edges: [],
                fav: true,
                cat: ("cat" in plan_child.attributes ? plan_child.attributes["cat"].nodeValue : "")
            };
            add_point(point_exit);
        }
        else if (plan_child.tagName == "Floor") {
            floor_num = parseInt(plan_child.attributes["num"].nodeValue);
            for (floor_child of plan_child.childNodes) {
                if (floor_child.tagName == "Path") {
                    // обрабатываем путь перемещения
                    if (!("dir" in floor_child.attributes)) {
                        alert("Поле dir отсутствует в корневом теге <Path>");
                    }
                    let dir_str = floor_child.attributes["dir"].nodeValue;
                    let dir = motionDirForStr(dir_str);
                    let path = {
                        walls: ("walls" in floor_child.attributes ? floor_child.attributes["walls"].nodeValue : "no"),
                        dir: dir, 
                        path_points: [],
                    };
                    // добавляем путь
                    plan.paths.push(path);
                    let path_index = plan.paths.length - 1;
                    // добавляем начальный пункт к пути
                    // тут важно указать этаж, поскольку пункт может оказаться
                    //   лестницей или лифтом, для которых идентификатор один и тот же на разных этажах
                    if (!("start" in floor_child.attributes)) {
                        alert("Поле start отсутствует в корневом теге <Path>");
                    }
                    let point_index = get_point_by_id(floor_child.attributes["start"].nodeValue, floor_num);
                    add_point_to_path(point_index, path_index);
                    // читаем путь
                    read_path(floor_child, path_index, floor_num);
                }
                else if (floor_child.tagName)
                    process_xml_node(floor_child, -1, floor_num);
            }
        }
        else if (plan_child.tagName == "Card") {
            let point_id = plan_child.attributes["point"].nodeValue;
            let card_text = plan_child.innerHTML;
            plan.cards.set(point_id, card_text);
        }
        else if (plan_child.tagName == "Category") {
            let category_id = plan_child.attributes["id"].nodeValue;
            let category_name = plan_child.attributes["name"].nodeValue;
            let category = {
                id: category_id,
                name: category_name,
                points: []
            };
            plan.categories.push(category);
            let category_index = plan.categories.length - 1;
            plan.category_by_id.set(category_id, category_index);
        }
    }
}

read_plan();
//console.log(plan);
