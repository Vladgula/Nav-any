// обрабатывает структуру данных "План здания" - добавляет ребра к каждому пункту
function process_plan ()
{
    // каждая площадка - это вершина графа
    for (let square_index = 0; square_index < plan.squares.length; square_index++) {
        vertex = {
            type: "square",  // тип вершины
            id: plan.squares[square_index].id,  // id площадки
            index: plan.vertices.length,  // индекс вершины
        };
        plan.vertices.push(vertex);
        plan.squares[square_index].vertex_index = vertex.index;
    }
    // каждый стык - это вершина графа
    //   (один и тот же стык в рамках разных площадок - это две разные вершины)
    for (let bound_index = 0; bound_index < plan.bounds.length; bound_index++) {
        // TODO: а если bound - это <Exit>?
        vertex = {
            type: "joint",  // тип вершины
            id: plan.bounds[bound_index].id,  // id стыка
            index: plan.vertices.length,  // индекс вершины
        }
        plan.vertices.push(vertex);
        plan.bounds[bound_index].vertex_index = vertex.index;
    }
    // каждый ориентир - это вершина графа
    for (let orient_index = 0; orient_index < plan.orients.length; orient_index++) {
        vertex = {
            type: "orient",  // тип вершины
            id: plan.orients[orient_index].id,  // id ориентира
            index: plan.vertices.length,  // индекс вершины
        }
        plan.vertices.push(vertex);
        plan.orients[orient_index].vertex_index = vertex.index;
    }

    // Задаём рёбра графа...
    // инициализация списков смежности
    for (let vertex_index = 0; vertex_index < plan.vertices.length; vertex_index++) {
        plan.edges.push(Array());
    }
    // любые два стыка с одинаковыми идентификаторами соединяются ребром
    for (let [joint_id, joints_list] of plan.joints_by_id) {
        if (joints_list.length == 2) {
            //console.log(joints_list);
            joint_index1 = joints_list[0];
            joint_index2 = joints_list[1];
            vertex_index1 = plan.bounds[joint_index1].vertex_index;
            vertex_index2 = plan.bounds[joint_index2].vertex_index;
            // TODO: сделать каждое ребро структурой? (чтобы отличать разновидности рёбер)
            plan.edges[vertex_index1].push(vertex_index2);  
            plan.edges[vertex_index2].push(vertex_index1);
            // TODO: завернуть эти две строчки в отдельную функцию add_edge?
        }
    }
    // любая площадка соединяется (двусторонними) рёбрами со всеми стыками,
    //   находящимися на этой площадке
    for (let bound_index = 0; bound_index < plan.bounds.length; bound_index++) { 
        // TODO: а если bound - это <Exit>?
        // TODO: сделать каждое ребро структурой? (чтобы отличать разновидности рёбер)
        let square_index = plan.square_by_id[plan.bounds[bound_index].square_id];
        //console.log(square_index);
        // ОШИБКА! у square обычно нет id! надо как-то идентифицировать площадки!

        vertex_index1 = plan.squares[square_index].vertex_index;  // вершина - площадка
        vertex_index2 = plan.bounds[bound_index].vertex_index;  // вершина - стык
        plan.edges[vertex_index1].push(vertex_index2);  
        plan.edges[vertex_index2].push(vertex_index1);
    }

    // любая площадка соединяется (двусторонними) рёбрами со всеми ориентирами,
    //   находящимися на этой площадке
    // TODO



    // ??? 
    // как сейчас написан read_plan: bound_by_id будет соответствовать только
    //   одному стыку? это неправильно, потому что у нас два стыка с одним id





    /*
    return;
    for (let path_index = 0; path_index < plan.paths.length; path_index++) {
        for (let i = 0; i < plan.paths[path_index].path_points.length; i++) {
            if (i == 0)
                continue;
            let point_index = plan.paths[path_index].path_points[i];
            let prev_point_index = plan.paths[path_index].path_points[i - 1];

            edge1 = { adj_point: point_index, path: path_index, reversed_path: false };
            plan.points[prev_point_index].edges.push(edge1);

            edge2 = { adj_point: prev_point_index, path: path_index, reversed_path: true };
            plan.points[point_index].edges.push(edge2);
        }
        // перебираем все лестницы и лифты, проводим ребра
        for (let [stairs_id, stairs_list] of plan.stairs_by_id) {
            for (let k = 0; k < stairs_list.length; k++) {
                for (let j = k + 1; j < stairs_list.length; j++) {
                    let point_index = stairs_list[k];
                    edge1 = { adj_point: stairs_list[j], path: -1, reversed_path: false };
                    plan.points[point_index].edges.push(edge1);
                    point_index = stairs_list[j];
                    edge2 = { adj_point: stairs_list[k], path: -1, reversed_path: false };
                    plan.points[point_index].edges.push(edge2);
                }
            }
        }
        for (let [elevator_id, elevators_list] of plan.elevator_by_id) {
            for (let k = 0; k < elevators_list.length; k++) {
                for (let j = k + 1; j < elevators_list.length; j++) {
                    let point_index = elevators_list[k];
                    edge1 = { adj_point: elevators_list[j], path: -2, reversed_path: false };
                    plan.points[point_index].edges.push(edge1);
                    point_index = elevators_list[j];
                    edge2 = { adj_point: elevators_list[k], path: -2, reversed_path: false };
                    plan.points[point_index].edges.push(edge2);
                }
            }
        }
    }
    */
}

process_plan();

console.log("=== process_plan: plan ===", plan);   // отладка
