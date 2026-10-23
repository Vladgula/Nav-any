// Находит кратчайший путь в графе
//     start: начальная вершина
//     finish: конечная вершина
// Возвращает массив вершин - кратчайший маршрут из start в finish;
//   если путь от start до finish не существует, возвращает null
function get_route (start, finish)
{
    // Алгоритм: обход графа в ширину
    let queue = [];  // очередь из вершин графа
    let visited_vertices = new Set();  // индексы (obj_index) обработанных вершин, кратчайший путь до которых найден
    // добавить начальную вершину в очередь, отметить её как посещённую
    queue.push(start);
    visited_vertices.add(start.obj_index);
    // для каждой вершины графа хранится её предшественник в маршруте
    let prev_vertex = new Array(plan.obj_counter);
    for (let i = 0; i < plan.obj_counter; i++)
        prev_vertex[i] = null;
    // в цикле производится удаление вершины из очереди и обработка непосещенных смежных вершин
    while (queue.length > 0) {
        let vertex = queue.shift();
        for (let adj_vertex of vertex.edges) {
            if (!visited_vertices.has(adj_vertex.obj_index)) {
                queue.push(adj_vertex);
                visited_vertices.add(adj_vertex.obj_index);
                prev_vertex[adj_vertex.obj_index] = vertex;
            }
        }
    }
    // Восстановление пути...
    // если путь не существует, вернуть null
    if (!visited_vertices.has(finish.obj_index))  // конечная вершина недостижима
        return null;
    let route = [];
    let vertex = finish;
    while (vertex) {  // пока vertex != null
        console.log(vertex);
        route.push(vertex);
        vertex = prev_vertex[vertex.obj_index];
    }
    route.reverse();
    return route;
}

// (TODO?) чтобы учесть длину коридора, может впоследствии потребоваться взвешенный граф

// отладка
route = get_route(plan.orients[0], plan.orients[8]);
console.log(route);
