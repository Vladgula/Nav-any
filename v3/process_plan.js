// Обрабатывает структуру данных "План здания" - формирует граф площадок, ориентиров и стыков
function process_plan ()
{
    // 1. Каждая площадка - это вершина графа
    // 2. Каждый стык - это вершина графа
    //    (один и тот же стык в рамках разных площадок - это две разные вершины)
    // 3. Каждый ориентир - это вершина графа

    // Провести двустороннее ребро
    let add_edge = function(obj1, obj2) {
        obj1.edges.push(obj2);
        obj2.edges.push(obj1);
    };

    // 4. Любые два стыка с одинаковыми идентификаторами соединяются ребром
    for (let [joint_id, joints_list] of plan.joints_by_id) {
        if (joints_list.length == 2) {
            joint1 = joints_list[0];
            joint2 = joints_list[1];
            add_edge(joint1, joint2);
            // (TODO?) сделать каждое ребро структурой? (чтобы отличать разновидности рёбер)
        }
    }

    // 5. Любая площадка/коридор/лестница соединяется (двусторонними) рёбрами со всеми стыками
    // и ориентирами, находящимися на этой площадке/коридоре/лестнице

    // Алгоритм: перечисляем все ориентиры/стыки; соединяем каждый из них со своей площадкой
    for (orient of plan.orients) {
        add_edge(orient, orient.parent_square);
    }
    for (joint of plan.joints) {
        add_edge(joint, joint.parent_square);
    }
}

process_plan();

console.log("=== process_plan: plan ===", plan);   // отладка
