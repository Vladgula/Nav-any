// Обрабатывает структуру данных "План здания" - формирует граф
function process_plan ()
{
    // Провести двустороннее ребро
    let add_edge = function(obj1, obj2) {
        if (!obj1 || !obj2) return;
        // Защита от дублирования
        if (!obj1.edges.includes(obj2)) obj1.edges.push(obj2);
        if (!obj2.edges.includes(obj1)) obj2.edges.push(obj1);
    };

    // 1. Соединяем стыки с одинаковыми ID
    for (let [joint_id, joints_list] of plan.joints_by_id) {
        if (joints_list.length == 2) {
            add_edge(joints_list[0], joints_list[1]);
        }
    }

    // 2. Соединяем ориентиры/комнаты с площадками
    for (let orient of plan.orients) {
        if (orient.parent_square) add_edge(orient, orient.parent_square);
    }

    // 3. Соединяем стыки с площадками
    for (let joint of plan.joints) {
        if (joint.parent_square) add_edge(joint, joint.parent_square);
    }

    // 4. Соединяем Коридоры с их стыками
    for (let corridor of plan.corridors) {
        // Ищем стыки, ID которых совпадают с началом и концом коридора
        let start_joint = plan.joints.find(j => j.id == corridor.start_id);
        let finish_joint = plan.joints.find(j => j.id == corridor.finish_id);
        
        if (start_joint) add_edge(corridor, start_joint);
        if (finish_joint) add_edge(corridor, finish_joint);
    }

    // 5. Соединяем Лестницы с их стыками (на будущее)
    for (let stairs of plan.stairs) {
        if (stairs.start_id) {
            let s = plan.joints.find(j => j.id === stairs.start_id);
            if (s) add_edge(stairs, s);
        }
        if (stairs.finish_id) {
            let s = plan.joints.find(j => j.id === stairs.finish_id);
            if (s) add_edge(stairs, s);
        }
    }
}

process_plan();

console.log("=== process_plan: Граф собран ===", plan);