

let toField = document.getElementById("to");
let fromField = document.getElementById("from");
let button = document.getElementById("button");
//let routeText = document.getElementById("route-text");
let errorText = document.getElementById("error-text");
let outputContainer = document.getElementById("output-container");
let outputBlock = document.getElementById("output");
let outFrom = document.getElementById("out-from");
let outTo = document.getElementById("out-to");
let state = false;

function getRouteStepComponentString(step_short_text, step_detail_text, route_card=false, route_scheme=false, scheme_detail_text="")
{
    let button = '';
    let detail_text = '';
    if (route_card) {
        button = '<div class="output__step-loupe-container"></div>';
        detail_text = ` <div class="output__step-detail-text" hidden>
                            <img src="images/plan/${step_detail_text}" alt=""/>
                        </div>`
    }
    else if (route_scheme) {
        button = '<div class="output__step-scheme-container"></div>';
        detail_text = ` <div class="output__step-detail-text" hidden>
                            <p>${scheme_detail_text}</p>
                            <img src="images/scheme/${step_detail_text}" alt=""/>
                        </div>`  
    }
    else if (step_detail_text.length !== 0) {
        button = '<div class="output__step-button-container"></div>';
        detail_text = `<div class="output__step-detail-text" hidden>${step_detail_text}</div>`
    }

    return `
        <div class="output__step-container">
            <div class="output__step-line">
                <div class="output__step-text">${step_short_text}</div>
                ${button}
            </div>
            ${detail_text}
        </div>`;//font-size: 1.25rem;
}

function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}

function showRoute()
{
    if (!state) {
        let from_point = fromField.value.toLowerCase();
        let to_point = toField.value.toLowerCase();

        let route = '';
        try {
            route = findRoute(from_point, to_point);
        } catch (e) {
            errorText.innerHTML = e.message;
            errorText.hidden = false;
            return;
        }

        //let route_str = route.join("<br/>");
        let route_str = route.map((val, idx) => {
            return getRouteStepComponentString(val.route, val.detailed_route, val.route_card, val.route_scheme, val.scheme_detail_text);
        }).join(' ');

        outputContainer.innerHTML = route_str;
        //routeText.hidden = false;
        //routeText.innerHTML = route_str;

        outFrom.innerHTML = from_point;
        outTo.innerHTML = to_point;

        toField.hidden = true;
        fromField.hidden = true;

        errorText.hidden = true;

        button.innerHTML = "Проложить новый маршрут";

        outputBlock.hidden = false;

        // toField.classList.add("collapsed");
        // fromField.classList.add("collapsed");

        state = true;
    } else {
        toField.hidden = false;
        toField.value = "";

        fromField.hidden = false;
        fromField.value = "";

        //routeText.hidden = true;

        button.innerHTML = "Проложить маршрут";

        outputBlock.hidden = true;

        state = false;
    }
}

outputContainer.addEventListener('click', function (e) {
    //console.log('Click: ' + e.target.innerHTML + ' Parent: ' + e.target.parentElement.innerHTML)

    let el = e.target;
    if (el.classList.contains('output__step-button-container') || el.classList.contains('output__step-loupe-container')
        || el.classList.contains('output__step-scheme-container'))
    {
        let step_container = el.closest('.output__step-container');
        if (step_container != null) {
            let detail_text_elements = step_container.getElementsByClassName('output__step-detail-text');
            if(detail_text_elements.length !== 0) {
                let e = detail_text_elements[0];
                e.hidden = !e.hidden;
            }
        }
    }
});

/*При нажатии ENTER в текстовом поле*/
const clickEvent = function(event) {
    if (event.key === "Enter") {
        event.preventDefault();
        showRoute();
    }
}

toField.addEventListener("keypress", clickEvent);
fromField.addEventListener("keypress", clickEvent);
