import React, { Component } from 'react';
import styled from 'styled-components';
import * as THREE from 'three';

import bg from 'assets/images/starfield.png';

const Background = styled.div`
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0;
    left: 0;
`;

export default class Starfield extends Component {
    componentDidMount() {
        let renderer = new THREE.WebGLRenderer();
        let scene = new THREE.Scene();
        let aspect = window.innerWidth / window.innerHeight;
        let camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1500);

        let textureLoader = new THREE.TextureLoader();
        let galaxyGeometry = new THREE.SphereGeometry(100, 30, 30);
        let galaxyMaterial = new THREE.MeshBasicMaterial({
            side: THREE.BackSide
        });
        let galaxy = new THREE.Mesh(galaxyGeometry, galaxyMaterial);
        textureLoader.crossOrigin = true;
        textureLoader.load(bg, function (texture) {
            galaxyMaterial.map = texture;
            scene.add(galaxy);
        })

        renderer.setSize(window.innerWidth, window.innerHeight);
        // may to append DOM element
        scene.add(camera);

        let render = function () {
            requestAnimationFrame(render);
            renderer.render(scene, camera);
        };

        render();
    }

    render() {
        return (
            <Background />
        );
    }
}