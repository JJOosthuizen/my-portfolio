import "./tailwind.css";
import "./style.css";
import * as THREE from "three";
import gsap from "gsap";
import vertexShader from "./shaders/vertex.glsl";
import fragmentShader from "./shaders/fragment.glsl";

import atmosphereVertexShader from "./shaders/atmosphereVertex.glsl";
import atmospherefragmentShader from "./shaders/atmosphereFragment.glsl";
import { BufferGeometry, Float32BufferAttribute } from "three";
import { Vertex } from "three";

const canvasContainer = document.querySelector("#canvas-container");
const scene = new THREE.Scene();
let camera = new THREE.PerspectiveCamera(
  75,
  canvasContainer.offsetWidth / canvasContainer.offsetHeight,
  0.1,
  1000
);
const renderer = new THREE.WebGLRenderer({
  antialias: true,
  canvas: document.querySelector(".webgl"),
});

renderer.setSize(canvasContainer.offsetWidth, canvasContainer.offsetHeight);
renderer.setPixelRatio(window.devicePixelRatio);
//jupiter sphere
const jupiterTexture = new THREE.TextureLoader().load("./images/jupiter.jpg");

const jupiter = new THREE.Mesh(
  new THREE.SphereGeometry(7, 50, 50),
  new THREE.MeshBasicMaterial({ map: jupiterTexture })
);
jupiter.position.z = -1500;
jupiter.position.x = -30;
scene.add(jupiter);
//mars sphere
const marsTexture = new THREE.TextureLoader().load("./images/mars.jpg");

const mars = new THREE.Mesh(
  new THREE.SphereGeometry(5, 50, 50),
  new THREE.MeshBasicMaterial({ map: marsTexture })
);
mars.position.z = -1015;
scene.add(mars);

//neptune
const neptuneTexture = new THREE.TextureLoader().load("./images/neptune.jpg");

const neptune = new THREE.Mesh(
  new THREE.SphereGeometry(7, 50, 50),
  new THREE.MeshBasicMaterial({ map: neptuneTexture })
);
neptune.position.z = -1700;
neptune.position.x = 500;
scene.add(neptune);

//create a sphere
//for ShaderMaterial to work we need vertexShader & fragmentShader
const sphere = new THREE.Mesh(
  new THREE.SphereGeometry(5, 50, 50),
  new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      globeTexture: {
        value: new THREE.TextureLoader().load("./images/globe.jpg"),
      },
    },
  })
);

//create atmosphere
const atmosphere = new THREE.Mesh(
  new THREE.SphereGeometry(6, 50, 50),
  new THREE.ShaderMaterial({
    vertexShader: atmosphereVertexShader,
    fragmentShader: atmospherefragmentShader,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide,
  })
);
atmosphere.scale.set(1.1, 1.1, 1.1);
//scene.add(atmosphere);

const group = new THREE.Group();
group.add(sphere);
scene.add(group);
//setting up star
const starGeometry = new THREE.BufferGeometry();
const starMaterial = new THREE.PointsMaterial({
  color: 0xffffff,
});
//make 10 000 stars
const starVertices = [];
for (let i = 0; i < 10000; i++) {
  const x = (Math.random() - 0.5) * 2000;
  const y = (Math.random() - 0.5) * 2000;
  const z = (-Math.random() - 0.05) * 3000;
  starVertices.push(x, y, z);
}

starGeometry.setAttribute(
  "position",
  new THREE.Float32BufferAttribute(starVertices, 3)
);

const stars = new THREE.Points(starGeometry, starMaterial);
scene.add(stars);

camera.position.z = 15;
camera.position.x = -10;

//creating world points

function createPoint({ lat, lng, country, message }) {
  const point = new THREE.Mesh(
    new THREE.BoxGeometry(0.1, 0.1, 0.8),
    new THREE.MeshBasicMaterial({
      color: "#3BF7FF",
      opacity: 0.4,
      transparent: true,
    })
  );

  //we need to convert degrees to radians for js to handle it
  const latitude = (lat / 180) * Math.PI;
  const longitude = (lng / 180) * Math.PI;
  const radius = 5;
  //how to calculate point position using lat and log value

  const x = radius * Math.cos(latitude) * Math.sin(longitude);
  const y = radius * Math.sin(latitude);
  const z = radius * Math.cos(latitude) * Math.cos(longitude);

  point.position.z = z;
  point.position.y = y;
  point.position.x = x;
  //lookAt makes that points are correct direction when world rotates
  //0, 0, 0 is the world position / default position
  point.lookAt(0, 0, 0);
  //4d matrix
  //translate points outside of globe (they were in globe)
  point.geometry.applyMatrix4(new THREE.Matrix4().makeTranslation(0, 0, -0.4));

  group.add(point);
  //animation for points
  gsap.to(point.scale, {
    z: 1.4,
    duration: 5,
    yoyo: true,
    repeat: -1,
    ease: "linear",
    delay: Math.random(),
  });

  point.country = country;
  point.message = message;
}
// 30.5595° S, 22.9375° E
createPoint({
  lat: -30.5595,
  lng: 22.9375,
  country: "South Africa",
  message: "Yes, this is where I live 😃",
});

sphere.rotation.y = -Math.PI / 2;

group.rotation.offset = {
  x: 0,
  y: 0,
};

const mouse = {
  x: 0,
  y: 0,
  down: false,
  xPrev: undefined,
  yPrev: undefined,
};
//raycaster
const raycaster = new THREE.Raycaster();

const msgContainer = document.querySelector("#msg-container");
const countryText = document.querySelector("#country");
const msgText = document.querySelector("#message");
//using gsap for animated mouse movement

let starsreverse = false;

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
  group.rotation.y += 0.002;
  mars.rotation.y += 0.002;
  jupiter.rotation.y += 0.002;
  neptune.rotation.y += 0.002;

  // gsap.to(group.rotation, {
  //   x: -mouse.y * 1.8,
  //   y: mouse.x * 1.8,
  //   duration: 2,
  // });

  renderer.render(scene, camera);

  // update the picking ray with the camera and mouse position
  raycaster.setFromCamera(mouse, camera);

  // calculate objects intersecting the picking ray
  const intersects = raycaster.intersectObjects(
    group.children.filter((mesh) => {
      return mesh.geometry.type === "BoxGeometry";
    })
  );

  group.children.forEach((mesh) => {
    mesh.material.opacity = 0.4;
  });

  gsap.set(msgContainer, {
    display: "none",
  });

  for (let i = 0; i < intersects.length; i++) {
    const box = intersects[i].object;
    box.material.opacity = 1;
    gsap.set(msgContainer, {
      display: "block",
    });

    countryText.innerHTML = box.country;
    msgText.innerHTML = box.message;
  }

  renderer.render(scene, camera);
  
  if ((stars.rotation.x >= 0.8)) {
    starsreverse = true;
  } else if (stars.rotation.x <= -0.8){
    starsreverse = false;
  }

  if (!starsreverse) {
    stars.rotation.x += 0.00005;
  } else {
    stars.rotation.x -= 0.00005;
  }
}
animate();

canvasContainer.addEventListener("mousedown", ({ clientX, clientY }) => {
  mouse.down = true;
  mouse.xPrev = clientX;
  mouse.yPrev = clientY;
});

addEventListener("mousemove", (event) => {
  if (innerWidth >= 1280) {
    mouse.x = ((event.clientX - innerWidth / 2) / (innerWidth / 2)) * 2 - 1;
    mouse.y = -(event.clientY / innerHeight) * 2 + 1;
  } else {
    const offset = canvasContainer.getBoundingClientRect().top;

    mouse.x = ((event.clientX - innerWidth / 2) / (innerWidth / 2)) * 2 - 1;
    mouse.y = -((event.clientY - offset) / innerHeight) * 2 + 1;
  }

  //use event.clientX because mouse.x is only -1 - 1
  gsap.set(msgContainer, {
    x: event.clientX,
    y: event.clientY,
  });

  if (mouse.down) {
    event.preventDefault();
    //delta is the change between 2 points
    const deltaX = event.clientX - mouse.xPrev;
    const deltaY = event.clientY - mouse.yPrev;
    group.rotation.offset.x += deltaY * 0.005;
    group.rotation.offset.y += deltaX * 0.005;

    gsap.to(group.rotation, {
      y: group.rotation.offset.y,
      x: group.rotation.offset.x,
      duration: 2,
    });
    mouse.xPrev = event.clientX;
    mouse.yPrev = event.clientY;
  }
});

addEventListener("mouseup", (event) => {
  mouse.down = false;
});

addEventListener("resize", () => {
  renderer.setSize(canvasContainer.offsetWidth, canvasContainer.offsetHeight);
  const cameraPosZ = camera.position.z;
  const cameraPosX = camera.position.x;
  const cameraPosRotation = camera.rotation.y;
  camera = new THREE.PerspectiveCamera(
    75,
    canvasContainer.offsetWidth / canvasContainer.offsetHeight,
    0.1,
    1000
  );
  camera.position.z = cameraPosZ;
  camera.position.x = cameraPosX;
  camera.rotation.y = cameraPosRotation;
});
//Go back to section
const btnBack = document.getElementsByClassName("btn-back");
let btnBackNum;
for (var i = 0; i < btnBack.length; i++) {
  btnBack[i].addEventListener("click", () => {
    //if statement change between
    console.log(btnBackNum);
    if (btnBackNum === 1) {
      gsap.to(marsContainer, {
        opacity: 0,
        onComplete: () => {
          marsContainer.classList.add("hidden");
          gsap.to(camera.position, {
            z: 15,
            x: -10,
            ease: "power3.inOut",
            duration: 2,
          });
          gsap.to(earthContainer, {
            opacity: 1,
            duration: 2,
            delay: 1,
          });
          earthContainer.classList.remove("invisible");
        },
      });
    } else if (btnBackNum === 2) {
      btnBackNum = 1;
      cvNum = 1;
      gsap.to(jupiterContainer, {
        opacity: 0,
        onComplete: () => {
          jupiterContainer.classList.add("hidden");
        },
      });

      gsap.to(camera.position, {
        z: -1000,
        x: 10,
        duration: 2,
        delay: 1,
      });
      gsap.to(camera.rotation, {
        y: 0,
        duration: 2,
        onComplete: () => {
          marsContainer.classList.remove("hidden");
          marsContainer.classList.remove("invisible");
          gsap.to(marsContainer, {
            opacity: 1,
            delay: 1,
          });
        },
      });
    } else if (btnBackNum === 3) {
      btnBackNum = 1;
      gsap.to(neptuneContainer, {
        opacity: 0,
        onComplete: () => {
          neptuneContainer.classList.add("hidden");
        },
      });
      gsap.to(camera.position, {
        z: -1000,
        x: 10,
        duration: 2,
        delay: 1,
      });
      gsap.to(camera.rotation, {
        y: 0,
        duration: 2,
        onComplete: () => {
          marsContainer.classList.remove("hidden");
          marsContainer.classList.remove("invisible");
          gsap.to(marsContainer, {
            opacity: 1,
            delay: 1,
          });
        },
      });
    }
  });
}

const btnExplore = document.querySelector("#btn-explore");
const marsContainer = document.querySelector("#mars-container");
const earthContainer = document.querySelector("#earth-container");

let cvNum = 1;
let workNum = 1;

btnExplore.addEventListener("click", (event) => {
  btnBackNum = 1;
  console.log(btnBackNum);
  // sphere.material.transparent = false;
  gsap.to(earthContainer, {
    opacity: 0,
  });

  gsap.to(camera.position, {
    z: -1000,
    x: 10,
    ease: "power3.inOut",
    duration: 2,
    delay: 1,
    onComplete: () => {
      earthContainer.classList.add("invisible");
      marsContainer.classList.remove("hidden");
      gsap.to(marsContainer, {
        opacity: 1,
        duration: 2,
        onComplete: () => {
          marsContainer.classList.remove("opacity-0");
        },
      });
    },
  });
});

const btnWork = document.querySelectorAll("#btn-work");
const jupiterContainer = document.querySelector("#jupiter-container");
const neptuneContainer = document.querySelector("#neptune-container");

for (var i = 0; i < btnWork.length; i++) {
  btnWork[i].addEventListener("click", () => {
    if (workNum === 1) {
      btnBackNum = 2;
      cvNum = 2;
      gsap.to(marsContainer, {
        opacity: 0,
        onComplete: () => {
          marsContainer.classList.add("invisible");
        },
      });
      gsap.to(camera.rotation, {
        y: 1,
        duration: 3,
      });
      gsap.to(camera.position, {
        z: -1500,
        x: -10,

        ease: "power3.inOut",
        duration: 2,
        delay: 1,
        onComplete: () => {
          jupiterContainer.classList.remove("hidden");
          // jupiterContainer.classList.add("display");
          marsContainer.classList.add("hidden");
          gsap.to(jupiterContainer, {
            opacity: 1,
            duration: 2,
            onComplete: () => {
              jupiterContainer.classList.remove("opacity-0");
            },
          });
        },
      });
    } else if (workNum === 2) {
      btnBackNum = 2;
      cvNum = 2;

      gsap.to(neptuneContainer, {
        opacity: 0,
        onComplete: () => {
          neptuneContainer.classList.add("invisible");
        },
      });
      gsap.to(camera.rotation, {
        y: 1,
        duration: 3,
      });
      gsap.to(camera.position, {
        z: -1500,
        x: -10,

        ease: "power3.inOut",
        duration: 2,
        delay: 1,
        onComplete: () => {
          jupiterContainer.classList.remove("hidden");
          // jupiterContainer.classList.add("display");
          neptuneContainer.classList.add("hidden");
          gsap.to(jupiterContainer, {
            opacity: 1,
            duration: 2,
            onComplete: () => {
              jupiterContainer.classList.remove("opacity-0");
            },
          });
        },
      });
    }
  });
}
const btnCV = document.querySelectorAll("#btn-cv");

for (var i = 0; i < btnCV.length; i++) {
  btnCV[i].addEventListener("click", () => {
    if (cvNum === 1) {
      btnBackNum = 3;
      workNum = 2;
      gsap.to(marsContainer, {
        opacity: 0,
        onComplete: () => {
          marsContainer.classList.add("invisible");
        },
      });
      gsap.to(camera.rotation, {
        y: -1,
        duration: 3,
      });
      gsap.to(camera.position, {
        z: -1680,
        x: 490,

        ease: "power3.inOut",
        duration: 2,
        delay: 1,
        onComplete: () => {
          neptuneContainer.classList.remove("invisible");
          neptuneContainer.classList.remove("hidden");
          marsContainer.classList.add("hidden");
          gsap.to(neptuneContainer, {
            opacity: 1,
            duration: 2,
            onComplete: () => {
              neptuneContainer.classList.remove("opacity-0");
            },
          });
        },
      });
    } else if (cvNum === 2) {
      btnBackNum = 3;
      workNum = 2;
      gsap.to(jupiterContainer, {
        opacity: 0,
        onComplete: () => {
          jupiterContainer.classList.add("invisible");
        },
      });
      gsap.to(camera.rotation, {
        y: -1,
        duration: 3,
      });
      gsap.to(camera.position, {
        z: -1680,
        x: 490,
        ease: "power3.inOut",
        duration: 2,
        delay: 1,
        onComplete: () => {
          neptuneContainer.classList.remove("invisible");
          neptuneContainer.classList.remove("hidden");
          jupiterContainer.classList.add("hidden");
          gsap.to(neptuneContainer, {
            opacity: 1,
            duration: 2,
            onComplete: () => {
              neptuneContainer.classList.remove("opacity-0");
            },
          });
        },
      });
    }
  });
}

addEventListener(
  "touchmove",
  (event) => {
    event.clientX = event.touches[0].clientX;
    event.clientY = event.touches[0].clientY;

    const doesIntersect = raycaster.intersectObject(sphere);
    console.log(doesIntersect);
    if (doesIntersect.length > 0) mouse.down = true;

    if (mouse.down) {
      const offset = canvasContainer.getBoundingClientRect().top;
      mouse.x = (event.clientX / innerWidth) * 2 - 1;
      mouse.y = -((event.clientY - offset) / innerHeight) * 2 + 1;
      console.log(mouse.y);

      gsap.set(msgContainer, {
        x: event.clientX,
        y: event.clientY,
      });

      event.preventDefault();
      // console.log('turn the earth')
      const deltaX = event.clientX - mouse.xPrev;
      const deltaY = event.clientY - mouse.yPrev;

      group.rotation.offset.x += deltaY * 0.005;
      group.rotation.offset.y += deltaX * 0.005;

      gsap.to(group.rotation, {
        y: group.rotation.offset.y,
        x: group.rotation.offset.x,
        duration: 2,
      });
      mouse.xPrev = event.clientX;
      mouse.yPrev = event.clientY;
    }

    // console.log(mouse)
  },
  { passive: false }
);

addEventListener("touchend", (event) => {
  mouse.down = false;
});
