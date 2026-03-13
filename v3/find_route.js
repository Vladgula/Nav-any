// по индексам начального и конечного пунктов a, b 
//   возвращает маршрут - массив индексов пунктов
function get_route (from_index, to_index)
{
    // BFS
    let queue = [];  // очередь из вершин графа
    let visited_vertices = new Set();  // обработанные вершины, кратчайший путь до которых найден
    queue.push(from_index);
    visited_vertices.add(from_index);
    let prev_vertex = new Array(plan.points.length);  // для каждой вершины графа храним ее предшественника
    for (let i = 0; i < plan.points.length; i++)
        prev_vertex[i] = -1;
    while (queue.length > 0) {
        let point_index = queue.shift();
        for (e of plan.points[point_index].edges) {
            let adj_point = e.adj_point;
            if (!visited_vertices.has(adj_point)) {
                queue.push(adj_point);
                visited_vertices.add(adj_point);
                prev_vertex[adj_point] = point_index;
            }
        }
    }
    // восстанавливаем путь
    let route = [];
    if (!visited_vertices.has(to_index))  // целевая вершина недостижима
        return route;
    let point_index = to_index;
    while (point_index != -1) {
        route.push(point_index);
        point_index = prev_vertex[point_index];
    }
    route.reverse();
    return route;
}

function get_edge (point, adj_point_index)
{
    for (let i = 0; i < point.edges.length; i++) {
        if (point.edges[i].adj_point == adj_point_index) {
            return point.edges[i];
        }
    }   
}

function get_route_text (route)
{
    let route_text = [];
    // let detailed_route_text = [];
    let i = 0;
    let j = 0;
    let edge = get_edge(plan.points[route[0]], route[1]);
    let path_index = edge.path;
    let reversed_path = edge.reversed_path;
    let d = -1;  // направление движения

    // начальное направление -- в зависимости
    //  от направления движения и с какой стенки комната    
    if (!reversed_path) {
        if (plan.points[route[0]].wall == "left")
            d = motionDirForStr("right");
        else if (plan.points[route[0]].wall == "right")
            d = motionDirForStr("left");
    }
    else {
        if (plan.points[route[0]].wall == "left")
            d = motionDirForStr("left");
        else if (plan.points[route[0]].wall == "right")
            d = motionDirForStr("right");       
    }

    //console.log(plan.points);
    // let start = true;
    route_text.push({route: "Начните движение с " + plan.points[route[0]].name + ".", detailed_route: ""});
    while (i < route.length && j < route.length) {
        j = i + 1;
        let new_path_index;
        let reversed_new_path;
        let reversed_path;
        while (j < route.length) {
            edge = get_edge(plan.points[route[j - 1]], route[j]);
            new_path_index = edge.path;
            reversed_new_path = edge.reversed_path;
            if (new_path_index != path_index) { // && !(reversed_new_path && plan.points[route[j]].type == "Joint")) {
                j = j - 1;
                break;
            }
            j = j + 1;
            reversed_path = reversed_new_path;
        }
        if (j == route.length) {
            j = j - 1;
        }
/*
        console.log(plan.points[route[i]]);
        console.log(plan.points[route[j]]);
        console.log(i + " " + j);
        console.log("reversed_new_path = " + reversed_new_path);
        console.log("reversed_path = " + reversed_path);
*/
       // console.log(plan.paths[path_index]);
        if (path_index == -1) {
            floorText =  " с " + plan.points[route[i]].floor +  " этажа до " + plan.points[route[j]].floor + " этажа.";
            let stairs_up = (plan.points[route[i]].floor < plan.points[route[j]].floor);
            route_text.push({route: (stairs_up ? "Поднимитесь" : "Спуститесь") + " по лестнице" + floorText,
                detailed_route: ""});
            // detailed_route_text.push("");
        } else if (path_index == -2) {
            route_text.push({route: "Проехать на лифте.",
                detailed_route: ""});
        } else {
            // заглушка
            if (plan.paths[path_index].scheme_text_backward) {
                route_text.push({route: plan.paths[path_index].scheme_text_backward,
                    detailed_route: plan.paths[path_index].scheme_photo, route_scheme: true, scheme_detail_text: ""});
                // еще добавить scheme_detail_text - например, "мимо ..." как доп. текст в путевой схеме
            }
                	
            //console.log(plan.points[route[i]]);
            //console.log(plan.points[route[j]]);
            
            let last_point_str = "";
            let pred_last_point_str = "";
            let block_text = "";
            let photo_uri = "";
            if (plan.points[route[j]].type == "Joint") {
                console.log(plan.points[route[j]].path + " " + path_index + " " + plan.points[route[j]].name);
                //console.log(reversed_new_path);
                if (plan.points[route[j]].path == path_index) {  // && !reversed_path) {  // тег Joint в конце текущего пути
                    console.log("в конце пути");
//                    if (!reversed_new_path) {
                        if (plan.points[route[j]].text_forward) {
                            block_text = plan.points[route[j]].text_forward;
                        }

                        if (plan.points[route[j]].photo_forward) {
                            photo_uri = plan.points[route[j]].photo_forward;
                        }
//                    }
//                    else {
  /*                      console.log("test");
                        console.log(plan.points[route[j]]);
                        if (plan.points[route[j]].text_backward) {
                            block_text = plan.points[route[j]].text_backward;
                        }

                        if (plan.points[route[j]].photo_backward) {
                            photo_uri = plan.points[route[j]].photo_backward;
//                        } 
                    }*/
                }
                else {  // с тега Joint начинается путь
                    cur_dir = plan.paths[path_index].dir;
                    if (reversed_path)
                        cur_dir = (cur_dir + 2) % 4;
                    new_dir = plan.paths[plan.points[route[j]].path].dir;
                    
                    if (reversed_new_path) {
                        new_dir = (new_dir + 2) % 4;
                    }

                    console.log("reversed_path = " + reversed_path + ", reversed_new_path = " + reversed_new_path);
                    console.log("cur_dir = " + motionDir[cur_dir] + ", new_dir = " + motionDir[new_dir]);

                    console.log(plan.points[route[j]]);
                   // console.log(cur_dir);
                   // console.log(new_dir);
                   // let rotate_dir = (new_dir - cur_dir + 4) % 4;
                    let rotate_dir = (cur_dir - new_dir + 4) % 4; 
                    if (reversed_new_path)
                        rotate_dir = (rotate_dir + 2) % 4;

                   // if (reversed_new_path && !reversed_path)
                   //     rotate_dir = (rotate_dir + 2) % 4;

                    console.log(reversed_new_path);
                    console.log(rotate_dir);

                    let dir_text = motionDir[rotate_dir];
                    let pt = plan.points[route[j]];
                   // console.log(motionDir[rotate_dir]);
                    if (dir_text == "left") {
                        block_text = pt.text_left;
                        photo_uri = pt.photo_left;
                    }
                    else if (dir_text == "right") {
                        block_text = pt.text_right;
                        photo_uri = pt.photo_right;
                    }
                    else if (dir_text == "up") {
                        block_text = pt.text_forward;
                        photo_uri = pt.photo_forward;
                    }
                    else {
                        block_text = pt.text_backward;
                        photo_uri = pt.photo_backward;
                    }
                }

                if (plan.points[route[j]].to) {
                    last_point_str = plan.points[route[j]].to;
                }
                if (i < j - 1) {
                    if (plan.points[route[j-1]].to)
                        pred_last_point_str = plan.points[route[j-1]].to;
                    else if (plan.points[route[j-1]].name)
                        pred_last_point_str = plan.points[route[j-1]].name;
                }

                if (block_text) {
                    last_point_str = pred_last_point_str;
                    pred_last_point_str = "";
                }
            }
            else {
                /*if (i < j - 1) {
                    if (plan.points[route[j-1]].to)
                        last_point_str = plan.points[route[j-1]].to;
                    else if (plan.points[route[j-1]].name)
                        last_point_str = plan.points[route[j-1]].name;
                }*/
                if (plan.points[route[j]].to)
                    last_point_str = plan.points[route[j]].to;
                else if (plan.points[route[j]].name)
                    last_point_str = plan.points[route[j]].name;                
            }
            let start_point_str = "";
            if (plan.points[route[i]].to)
                start_point_str = plan.points[route[i]].to;
            else if (plan.points[route[i]].name)
                start_point_str = plan.points[route[i]].name;
            
            let text0 = "";
            if (d > motionDirForStr("up")) {
                if (motionDir[d] == "left") {
                    text0 = "Поверните налево";
                } else if (motionDir[d] == "down") {
                    text0 = "Поверните назад";
                } else if (motionDir[d] == "right") {
                    text0 = "Поверните направо";
                }
            }           
            if (text0)
                text0 += " и пройдите";
            else
                text0 = "Пройдите прямо";
            // text0 += " от " + start_point_str + " до ";
            let text1 = "";
            if (last_point_str && pred_last_point_str)
                text1 = pred_last_point_str + " и " + last_point_str;
            else if (last_point_str && !pred_last_point_str)
                text1 = last_point_str;
            else if (!last_point_str && pred_last_point_str)
                text1 = pred_last_point_str;

            let text;
            if (text1) {
                text0 += " до ";
                text = text0 + text1;  //"Пройти " + plan.points[route[i]].name + " - " + plan.points[route[j]].name;
            }
            else {
              text = text0;
            }
            let detailed_text = "";
            if (j > i + 1) {
                let hidden = true;
                for (let k = i + 1; k < j; k++) {
                    if (!plan.points[route[k]].hidden) {
                        hidden = false;
                        break;
                    }
                }
                if (!hidden) {
                    detailed_text += " мимо: ";
                }
                let flag = false;
                for (let k = i + 1; k < j; k++) {
                    if (!plan.points[route[k]].hidden) {
                        if (flag) {
                            detailed_text += ", ";
                        }
                        flag = true;
                        detailed_text += plan.points[route[k]].name;
                    }
                }
            }
            
            text += ".";
            route_text.push({route: text, detailed_route: detailed_text});
            if (block_text)
                route_text.push({route: block_text, detailed_route: photo_uri, route_card: photo_uri !== ""});
        }
        
        if (new_path_index >= 0 && path_index >= 0) {
            let dir1 = plan.paths[new_path_index].dir;
            if (reversed_new_path) {
                dir1 = rotate_dir(dir1, "back");
            }
            let dir2 = plan.paths[path_index].dir;
            if (reversed_path) {
                dir2 = rotate_dir(dir2, "back");
            }
            d = (dir1 - dir2 + 4) % 4;
        }
        
        path_index = new_path_index;
        reversed_path = reversed_new_path;
        i = j;
        if (i == route.length - 1) {
            break;
        }

        // start = false;       
    }
    route_text.push({route: "Вы на месте!", detailed_route: "", route_card: false});
    return route_text;  // { route: route_text,  detailed_route: detailed_route_text };
}

function findRoute (point_from, point_to)
{
    point_from = point_from.trim();
    point_to = point_to.trim();

    if (!point_from || !point_to)
        throw new Error('Пункты не могут быть пустыми');

    //let route_strs = [`Маршрут от ${point_from} до ${point_to}`];

    if (point_from === point_to) {
        throw new Error('Пункты отправления и назначения совпадают');
    }

    if (!plan.point_by_id.has(point_from)) {
        //route_strs.push(`Пункт ${point_from} отсутствует`);
        throw new Error(`Пункт ${point_from} отсутствует`);
    }
    if (!plan.point_by_id.has(point_to)) {
        //route_strs.push(`Пункт ${point_to} отсутствует`);
        throw new Error(`Пункт ${point_to} отсутствует`);
    }

    let route = get_route(plan.point_by_id.get(point_from), plan.point_by_id.get(point_to));
    if (route.length == 0) {
        throw new Error(`Пункт ${point_to} недостижим из пункта ${point_from}`);
    }

    let route_text = get_route_text(route);
    //route_strs.push.apply(route_strs, route_text);  // добавить route_text к route_strs
    return route_text;
}
