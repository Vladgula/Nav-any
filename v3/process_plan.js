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
    */
    }
}

process_plan();

console.log("=== process_plan: plan ===", plan);   // отладка
