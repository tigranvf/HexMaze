import * as THREE from '/static/maze/js/three.module.min.js';
import {FirstPersonControls} from '/static/maze/js/FirstPersonControls.js';

const resolution = {
    width: window.innerWidth,
    height: window.innerHeight,
};

const cx = resolution.width / 2;
const cy = resolution.height / 2;

var game_map = [];

const a = 2 * Math.PI / 6;

const radius = 5;
const diameter = 2 * radius + 1;
//var size = (0.5*Math.sqrt(3)*canvas.height)/(3*diameter);

const fov = 60;
const camera = new THREE.PerspectiveCamera(fov, resolution.width / resolution.height, 0.01, 10);
camera.position.set(0, 1, 0);
camera.rotation.order = "YXZ";
const scene = new THREE.Scene();
const material = new THREE.MeshStandardMaterial({color: 'yellow', roughness: 0.5, metalness: 0.5, side: THREE.DoubleSide});
const renderer = new THREE.WebGLRenderer({antialias: true});

const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const pointLight = new THREE.PointLight(0xffffff, 1);
pointLight.position.set(5, 5, 5);
scene.add(pointLight);

var player = {
    color: 'green',
    size: 5,
};

var direction = [0, 0];

var [yaw, pitch] = [0.01, 0.005];
var [minAng, maxAng] = [-1, 1];

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
    if (q < 0) {
        game_map[q+radius][r+q+radius][3] = false;
    } else {
        game_map[q+radius][r+radius][3] = false;
    }
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
    for (let dq = -1; dq <= 1; dq++) {
        for (let dr = -1; dr <= 1; dr++) {
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
    let neighborhoods, neighborhood, tq, tr, stack, maze_generated;
    [tq, tr] = [0, 0];
    stack = []
    maze_generated = false;
    while (!maze_generated) {
        neighborhoods = getNeighborhoods(tq, tr);

        if (neighborhoods.length) {
            neighborhood = choose(neighborhoods); // 0, -2
            breakWall(tq, tr, ...neighborhood);
            stack.push([tq, tr]);
            [tq, tr] = neighborhood;
            markAsVisited(tq, tr);
        } else {
            if (stack.length) {
                [tq, tr] = stack.pop();
            } else {
                maze_generated = true;
            }
        }
    }
}

function init() {
    // maze
    createMap();
    generateMaze();

    // THREE.js

    drawMap();
    renderer.setSize(resolution.width, resolution.height);
    renderer.setAnimationLoop(update);
    document.body.appendChild(renderer.domElement);
}

function drawMap() {
    let q, r, x, y;
    for (q = -radius; q <= radius; q++) {
        for (r = -radius; r <= radius; r++) {
            if ((Math.abs(-q-r)) <= radius) {
                drawTile(q, r, getTile(q, r));
            }
        }
    }
}

function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function update(time) {
    renderer.render(scene, camera);
}

function h2p(q, r) {
    return [1.5 * q, Math.sqrt(3)/2 * q + Math.sqrt(3) * r]
}

function f2r(fverts, flines) {
    let geometry = new THREE.BufferGeometry();
    let [vertices, faces] = [[], []]
    for (let fvert of fverts) {
        vertices.push(fvert[0], 0, fvert[1]);
        vertices.push(fvert[0], 2, fvert[1]);
    }
    for (let fline of flines) {
        faces.push(fline[0]*2, fline[0]*2+1, fline[1]*2);
        faces.push(fline[1]*2, fline[1]*2+1, fline[0]*2+1);
    }
    geometry.setIndex(faces);
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3));
    return geometry;
}

function drawTile(q, r, tile) {
    let [x, y] = h2p(q, r);

    let fverts = []; // flat representation of vertices
    let flines = []; // flat representation of faces
    let conds = [
        q == -radius,
        q == radius,
        r == radius,
        -q-r == -radius,
    ];

    let naverts = false; // need additional vertices
    conds.forEach((el) => {naverts = naverts || el;});

    if (naverts) {
        let extra = [
            conds[1] || conds[3],
            conds[2] || conds[3],
            conds[2] || conds[0],
        ];

        for (let i = 0; i <= 3; i++) {
            fverts.push([x + Math.cos(a * i), y + Math.sin(a * i)]);
            if (i && extra[i-1]) {
                flines.push([i-1, i])
            }
        }
    }
    for (let i = 3; i <= 6; i++) {
        fverts.push([x + Math.cos(a * i), y + Math.sin(a * i)]);
        if (tile[i-4]) {
            flines.push(naverts ? [i, i+1] : [i-4, i-3]);
        }
    }
    let geometry = f2r(fverts, flines); // converts fverts and flines to geometry object in three js
    scene.add(new THREE.Mesh(geometry, material));
}

function movePlayer() {
    player.pos = velocity
}

function drawPlayer() {
    ctx.beginPath();
    ctx.arc(player.pos[0]+cx, player.pos[1]+cy, player.size, 0, 2 * Math.PI);
    ctx.fillStyle = "orange";
    ctx.fill();
}

window.addEventListener('keydown', (e) => {
    if (e.key == "w") {
        direction[0] = 1;
    } else if (e.key == "d") {
        direction[1] = 1;
    } else if (e.key == "s") {
        direction[0] = -1;
    } else if (e.key == "a") {
        direction[1] = -1;
    }
    if (e.key == "l") {
        renderer.domElement.requestPointerLock();
    }
});

window.addEventListener('mousemove', (event) => {
    camera.rotation.y += yaw*event.movementX;
    camera.rotation.x += pitch*event.movementY;
    if (camera.rotation.x < minAng) {camera.rotation.x = minAng;}
    else if (camera.rotation.x > maxAng) {camera.rotation.x = maxAng;}
});

window.addEventListener('resize', () => {
    resolution.width = window.innerWidth;
    resolution.height = window.innerHeight;
    camera.aspect = resolution.width/resolution.height;
    camera.updateProjectionMatrix();
    renderer.setSize(resolution.width, resolution.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

init();