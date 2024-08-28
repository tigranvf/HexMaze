var theme;

fetch(`${theme_folder}/${theme_name}.json`)
  .then(response => response.json())
  .then(data => {
    theme = data;
    console.log(theme); // Use the JSON data here
    document.body.style.backgroundColor = theme.bg_color;
    document.body.style.backgroundImage = `url(${theme.bg_img})`;
    document.body.style.backgroundRepeat = 'no-repeat';
    if (theme.bg_img_mode == "clip") {
        document.body.style.backgroundSize = window.innerWidth>=window.innerHeight?`${window.innerWidth}px`:`auto ${window.innerHeight}px`;
    } else if (theme.bg_img_mode == "fit") {
        document.body.style.backgroundSize = `${window.innerWidth}px ${window.innerHeight}px`;
    }
    timer.style.backgroundColor = theme.timer_bg_color;
    timer.style.color = theme.timer_color; console.log(size);
    timer.style.padding = `${parseInt(size/20*5)+1}px`;
    timer_a.style.fontSize = `${parseInt(size/20*60)}px`;
    timer_b.style.fontSize = `${parseInt(size/20*36)}px`;
    container.style.fontSize = `${parseInt(size/20*36)}px`
    end_game_popup.style.fontSize = `${parseInt(size/20*96)}px`;
    end_game_popup.style.color = theme.game_over_popup_color;
    end_game_popup.style.shadow = `${end_game_popup_shadow_size}px ${end_game_popup_shadow_size}px ${end_game_popup_shadow_size*5}px ${theme.game_over_popup_shadow_color}`;

    init();
  })
  .catch(error => {
    console.error("Error loading JSON file: ", error);
  });

const FPS_display = document.getElementById('fps');
const container = document.getElementById('num');
const timer   = document.getElementById("timer");
const timer_a = document.querySelector("#timer>#a");
const timer_b = document.querySelector("#timer>#b");
const end_game_popup = document.getElementById('endGame');
const end_game_popup_score = end_game_popup.querySelector("#score");
var first_input;
const time_limit = 15000;
var game_finished = false;

const canvas = document.getElementById('canvas');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
var cx = canvas.width / 2;
var cy = canvas.height / 2;
const ctx = canvas.getContext('2d');
ctx.textAlign = 'center'; // Horizontal alignment
ctx.textBaseline = 'middle'; // Vertical alignment

var game_map = [];
var stack = [];
var [tq, tr] = [0, 0];
const animated_generation = true;
var maze_generated = false;
const maze_generation_method = 0;
const a = 2 * Math.PI / 6;

var platform = navigator.platform;
var radius = 5;
var diameter = 2 * radius + 1;
var size = Math.min((0.5*Math.sqrt(3)*canvas.height)/(3*diameter), (canvas.width)/(3*diameter));
var mode_progress_y = canvas.width > canvas.height ? canvas.height / 8 : (canvas.height-diameter*(Math.sqrt(3)*size))/4;
var mode_progress_size = parseInt(size/10*45);
var fps_counter_size = parseInt(size/20*45);
var popup_shadow_size = parseInt(size/20*2);
var end_game_popup_shadow_size = parseInt(size/20*5);
var player = {
    pos: [0, 0],
    color: 'green',
    size: 0.6,
};
var score = 0;

var velocity = [
    0,
    0,
];

function createMap() {
    let height;
    for (let a = -radius; a <= radius; a++) {
        // game_map.push(new Array(diameter-Math.abs(i)).fill(new Array(3).fill(true)));
        height = diameter-Math.abs(a);
        let col = new Array(height);
        for (let b = 0; b < height; b++) {
            col[b] = new Array(4).fill(true);
        }
        game_map.push(col);
    }
}

function markAsVisited(q, r) {
    setTile(q, r, false, 3);
}

function breakWall(aq, ar, bq, br) {
    let dq = bq - aq;
    let dr = br - ar;
    if (dr > 0 || -dq-dr < 0) {
        return breakWall(bq, br, aq, ar);
    }
    let wall_id;
    if (dq) {
        wall_id = dq/2+0.5-dr;
    } else {
        wall_id = -dr;
    }
    if (aq < 0) {
        game_map[aq+radius][ar+aq+radius][wall_id] = false;
    } else {
        game_map[aq+radius][ar+radius][wall_id] = false;
    }
    return;
}

function getTile(q, r) {
    if (q < 0) {
        return game_map[q+radius][r+q+radius];
    } else {
        return game_map[q+radius][r+radius];
    }
}

function setTile(q, r, state, index = -1) {
    if (index == -1) {
        if (q < 0) {
            return game_map[q+radius][r+q+radius] = state;
        } else {
            return game_map[q+radius][r+radius] = state;
        }
    }
    if (q < 0) {
        return game_map[q+radius][r+q+radius][index] = state;
    } else {
        return game_map[q+radius][r+radius][index] = state;
    }
}

function isInGame(q, r) {
    return (Math.abs(q) <= radius) && (Math.abs(r) <= radius) && (Math.abs(q+r) <= radius)
}

function isBlocked(aq, ar, bq, br) {
    let dq = bq - aq;
    let dr = br - ar;
    if (dr > 0 || -dq-dr < 0) {
        return isBlocked(bq, br, aq, ar);
    }
    let wall_id;
    if (dq) {
        wall_id = dq/2+0.5-dr;
    } else {
        wall_id = -dr;
    }
    let cur_tile = getTile(aq, ar);
    return cur_tile[wall_id];
}

function hasVisited(q, r) {
    let cur_tile = getTile(q, r);
    return !cur_tile[3];
}

function getNeighborhoods(q, r) {
    let output = [];
    for (let dq = -1; dq <= 1; dq++) { // dq = 0
        for (let dr = -1; dr <= 1; dr++) { // dr = -1
            if (Math.abs(dq+dr) <= 1 && !(dq == 0 && dr == 0)) { // true
                if (isInGame(q+dq, r+dr) && !hasVisited(q+dq, r+dr)) {
                    output.push([q+dq, r+dr]);
                }
            }
        }
    }
    return output;
}

function choose(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function generateMaze() {
    if (maze_generation_method == 0) {
        markAsVisited(0, 0);
        while (!maze_generated){
            let neighborhoods = getNeighborhoods(tq, tr); // [[0, -3]]

            if (neighborhoods.length) { // true
                let neighborhood = choose(neighborhoods); // 0, -2
                breakWall(tq, tr, ...neighborhood);
                stack.push([tq, tr]);
                [tq, tr] = neighborhood;
                markAsVisited(tq, tr);
        //        if (animated_generation) {
        //            drawHexagon(...h2p(tq, tr), player.size, 1, 'black', 'blue');
        //        }
            } else {
                if (stack.length) {
                    [tq, tr] = stack.pop();
        //            if (animated_generation) {
        //                drawHexagon(...h2p(tq, tr), player.size, 1, 'black', 'blue');
        //            }
                } else {
                    maze_generated = true;
                }
            }
        }
    }
}

function prepare4mode() {
    if (mode == "money_rain") {
        for (let q = -radius; q <= radius; q++) {
            for (let r = -radius; r <= radius; r++) {
                if (!isInGame(q, r)) {continue;}
                setTile(q, r, true, 3);
            }
        }

        markAsVisited(0, 0);
        score = 1;
    }
}

function init() {
    FPS_display.style.fontSize = `${parseInt(size/40*45)}px`;
    createMap();
    generateMaze();
    prepare4mode();
    update();
}

function drawMap() {
    let q, r, x, y;
    for (q = -radius; q <= radius; q++) {
        for (r = -radius; r <= radius; r++) {
            if ((Math.abs(-q-r)) > radius) {continue;}

            let tile = getTile(q, r);

                // x, y, tile_size, stroke_width, stroke_color, fill_color
            drawHexagon(...h2p(q, r), size, 0, 0, (mode=="money_rain" && tile[3]) ? theme.money_rain_color : theme.tile_bg_color);
            drawTile(q, r, tile);
        }
    }
}

function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function drawMode(timestamp) {
    if (mode=="money_rain") {
        if (game_finished) {return;}
        ctx.font = `${mode_progress_size}px Arial`;
        ctx.fillStyle = theme.money_rain_mode_info_color;
        ctx.fillText(`Score: ${score}`, cx, mode_progress_y);

        let time = time_limit-(timestamp-first_input);
        if (!time) {time = time_limit;}
        if (time <= 0) {
            time = 0;
            game_finished = true;
            end_game_popup.hidden = false;
            end_game_popup_score.textContent = `You scored: ${score}`;
        }
        timer_a.textContent = `${parseInt(time/60000%24).toString().padStart(2, '0')}:${parseInt(time/1000%60).toString().padStart(2, '0')}`
        timer_b.textContent = `.${parseInt(time%1000/10).toString().padStart(2, '0')}`;
    }
}

var last_frame = 0;
var frame_count = 0;

function fps_counter(timestamp) {
    if (!last_frame) {
        last_frame = timestamp; // this reset called two times, but it`s ok
    }

    frame_count++;

    if ((timestamp-last_frame) >= 1000) {
        FPS_display.textContent = `FPS: ${frame_count}`;
        frame_count = 0;
        last_frame = timestamp;
    }
}
function update(timestamp) {
    fps_counter(timestamp);
    // ctx.fillStyle = theme.bg_color;
    // ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
//    if (animated_generation && !maze_generated) {
//        generateMaze();
//    }
    if (mode == "money_rain") {
        if (game_finished) {

        } else {
            movePlayer(timestamp);
        }
    }
    drawMap();
    drawMode(timestamp);
    drawPlayer();
    if (canvas.height > canvas.width) {
        ctx.font = "45px Arial";
        ctx.fillStyle = 'red';
        ctx.fillText("We recommend using horizontal orientation", cx, 150);
    }
    requestAnimationFrame(update);

//    setTimeout(update, 1000);
}

function h2p(q, r) {
    x = size * 1.5 * q;
    y = size * (Math.sqrt(3)/2 * q + Math.sqrt(3) * r);
    return [x, y]
}

function drawTile(q, r, tile) {

    let [x, y] = h2p(q, r);
    ctx.beginPath();
    if (q == -radius || q == radius || r == radius || -q-r == -radius) {
        extra = [
            q == radius || -q-r == -radius,
            r == radius || -q-r == -radius,
            r == radius ||    q == -radius,
        ]
        for (let i = 0; i <= 3; i++) {
            if (i == 0) {
                ctx.moveTo(cx + x + size * Math.cos(a * i), cy + y + size * Math.sin(a * i));
            } else {
                if (extra[i-1]) {
                    ctx.lineTo(cx + x + size * Math.cos(a * i), cy + y + size * Math.sin(a * i));
                } else {
                    ctx.moveTo(cx + x + size * Math.cos(a * i), cy + y + size * Math.sin(a * i));
                }
            }
        }
    }
    for (let i = 3; i <= 6; i++) {
        if (i == 3) {
            ctx.moveTo(cx + x + size * Math.cos(a * i), cy + y + size * Math.sin(a * i));
        } else {
            if (tile[i-4]) {
                ctx.lineTo(cx + x + size * Math.cos(a * i), cy + y + size * Math.sin(a * i));
            } else {
                ctx.moveTo(cx + x + size * Math.cos(a * i), cy + y + size * Math.sin(a * i));
            }
        }
    }
    ctx.strokeStyle = theme.wall_color;
    ctx.lineWidth = theme.wall_width;
    ctx.stroke();
}

function drawHexagon(x, y, tile_size, stroke_width, stroke_color, fill_color) {
    ctx.beginPath();
    for (var i = 0; i < 6; i++) {
        ctx.lineTo(cx + x + tile_size * Math.cos(a * i), cy + y + tile_size * Math.sin(a * i));
    }
    ctx.closePath();

    if (stroke_width) {
        ctx.lineWidth = stroke_width;
        ctx.strokeStyle = stroke_color;
        ctx.stroke();
    }

    if (fill_color) {
        ctx.fillStyle = fill_color;
        ctx.fill();
    }
}

function movePlayer(timestamp) {
    let [q, r] = player.pos;
    let [fq, fr] = [q+velocity[0], r+velocity[1]];
    if (isInGame(fq, fr) && !isBlocked(q, r, fq, fr)) {
        player.pos = [fq, fr]
        velocity = [0, 0];
        if (mode=="money_rain") {
            if (!first_input) {first_input = timestamp;}
            let tile = getTile(fq, fr);
            if (tile[3] == false) {
                return;
            }
            score+=1;
            if (fq < 0) {
                game_map[fq+radius][fr+fq+radius][3] = false;
            } else {
                game_map[fq+radius][fr+radius][3] = false;
            }
            const number = document.createElement('div');
            number.className = 'fnum';
            let [x, y] = h2p(fq, fr);
            number.style.left = `${x+cx}px`;
            number.style.top = `${y+cy}px`;
            number.style.color = theme.popup_color;
            number.style.textShadow = `${popup_shadow_size}px ${popup_shadow_size}px ${popup_shadow_size*2.5}px ${theme.popup_shadow_color}`;
            number.textContent = "+1";
            container.appendChild(number);

            number.addEventListener('animationend', () => {
                container.removeChild(number);
            });
        }
    }
}

function drawPlayer() {
    drawHexagon(...h2p(...player.pos), player.size*size, theme.player_stroke_width, theme.player_stroke_color, theme.player_fill_color);
}

window.addEventListener("resize", (e) => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    cx = canvas.width / 2;
    cy = canvas.height / 2;
    size = Math.min((0.5*Math.sqrt(3)*canvas.height)/(3*diameter), (canvas.width)/(3*diameter));
    mode_progress_y = canvas.width > canvas.height ? canvas.height / 8 : (canvas.height-diameter*(Math.sqrt(3)*size))/4;
    mode_progress_size = parseInt(size/10*45);
    popup_shadow_size = parseInt(size/20*2);
    end_game_popup_shadow_size = parseInt(size/20*5);
    FPS_display.style.fontSize = `${parseInt(size/40*45)}px`;
    timer_a.style.fontSize = `${parseInt(size/20*60)}px`;
    timer_b.style.fontSize = `${parseInt(size/20*36)}px`;
    timer.style.padding = `${parseInt(size/20*5)+1}px`;
    container.style.fontSize = `${parseInt(size/20*36)}px`
    end_game_popup.style.fontSize = `${parseInt(size/20*96)}px`;
    end_game_popup.style.shadow = `${end_game_popup_shadow_size}px ${end_game_popup_shadow_size}px ${end_game_popup_shadow_size*5}px ${theme.game_over_popup_shadow_color}`;

    ctx.textAlign = 'center'; // Horizontal alignment
    ctx.textBaseline = 'middle'; // Vertical alignment
    if (theme.bg_img_mode == "clip") {
        document.body.style.backgroundSize = window.innerWidth>=window.innerHeight?`${window.innerWidth}px`:`auto ${window.innerHeight}px`;
    } else if (theme.bg_img_mode == "fit") {
        document.body.style.backgroundSize = `${window.innerWidth}px ${window.innerHeight}px`;
    }
})

window.addEventListener('keydown', (e) => {
    if (e.key == "q") {
        velocity = [-1, 0];
    } else if (e.key == "w") {
        velocity = [0, -1];
    } else if (e.key == "e") {
        velocity = [1, -1];
    } else if (e.key == "d") {
        velocity = [ 1, 0];
    } else if (e.key == "s") {
        velocity = [0,    1];
    } else if (e.key == "a") {
        velocity = [-1, 1];
    }
});

// init();
