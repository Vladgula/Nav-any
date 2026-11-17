// Простая расшифровка маршрута (массива вершин графа) в текст.
// Работает с текущей структурой plan (squares/corridors/stairs/orients/joints).

// Человекочитаемое имя вершины
function vertexLabel(v) {
    if (!v) return "?";
    switch (v.obj_type) {
        case "square":   
            if (v.name) return v.name;
            // Если имени нет, дадим красивое название по ID
            if (v.id === "landing_1" || v.id === "landing_2") return "Лестничная площадка";
            return "Площадка (" + v.id + ")";
        case "corridor": 
            return v.name || "Коридор";
        case "stairs":   
            return "Лестница";
        case "orient":   
            return v.name || "Ориентир";
        case "room":     
            return v.no ? ("Аудитория " + v.no) : (v.name || "Комната");
        case "joint":    
            return "стык " + v.id;
        case "exit":     
            return "выход";
        default:         
            return v.obj_type + " " + v.id;
    }
}

// Падежная форма для «пройдите в …» (упрощённо — через "в" + винительный)
function vertexToPhrase(v) {
    // у square/corridor есть поле to (родительный падеж для "до"), 
    // но для простоты используем именительный
    return vertexLabel(v);
}

// Короткая метка для ориентира-цели
function orientPhrase(v) {
    return v.name || v.no || v.id || "объект";
}

// Основная функция: маршрут (массив вершин) -> массив строк
function get_simple_route_text(route) {
    if (!route || route.length === 0) return ["Маршрут не найден."];

    const lines = [];
    lines.push("Начните движение от: " + orientPhrase(route[0]) + ".");

    for (let k = 1; k < route.length; k++) {
        const prev = route[k - 1];
        const cur  = route[k];

        // --- переход между двумя "пространствами" через стык ---
        if (cur.obj_type === "joint") {
            // вошли в стык: описываем, что это за стык
            if (cur.text) {
                lines.push("  → " + cur.text + " (стык " + cur.id + ").");
            } else {
                lines.push("  → дойдите до стыка " + cur.id + ".");
            }
            continue;
        }

        // --- из стыка в пространство ---
        if (prev.obj_type === "joint" && 
            (cur.obj_type === "square" || cur.obj_type === "corridor" || cur.obj_type === "stairs")) {
            if (cur.obj_type === "corridor") {
                lines.push("Пройдите через коридор «" + vertexLabel(cur) + "».");
            } else if (cur.obj_type === "stairs") {
                lines.push("Пройдите по лестнице " + (cur.id || "") + ".");
            } else {
                lines.push("Пройдите на площадку «" + vertexLabel(cur) + "».");
            }
            continue;
        }

        // --- пространство -> ориентир (цель) ---
        if (cur.obj_type === "orient" || cur.obj_type === "room") {
            lines.push("Вы пришли: " + orientPhrase(cur) + ".");
            continue;
        }

        // --- прочие случаи (ориентир -> площадка и т.п.) ---
        if (prev.obj_type === "orient" || prev.obj_type === "room") {
            lines.push("От «" + orientPhrase(prev) + "» двигайтесь к «" + vertexLabel(cur) + "».");
            continue;
        }

        // fallback
        lines.push("Перейдите: " + vertexLabel(prev) + " → " + vertexLabel(cur) + ".");
    }

    lines.push("Вы на месте!");
    return lines;
}

// Простой поиск маршрута по id (с учётом текущей структуры plan)
function simpleFindRoute(fromId, toId) {
    const from = plan.object_by_id.get(fromId);
    const to   = plan.object_by_id.get(toId);
    if (!from) throw new Error("Нет пункта " + fromId);
    if (!to)   throw new Error("Нет пункта " + toId);

    const route = get_route(from, to);   // из graph_route.js
    if (!route) throw new Error("Маршрут не найден");
    return get_simple_route_text(route);
}

// Пример: от "Урна для мусора" до "Диван с зарядкой"
// (id ориентиров в Plan.xml не заданы, поэтому используем площадки/стыки)
console.log(simpleFindRoute("landing_1", "square_rest").join("\n"));