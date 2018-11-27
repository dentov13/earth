import React, { Component } from 'react';
import styled from 'styled-components';
import * as THREE from 'three';

import bg from 'assets/images/starfield.png';

const Container = styled.div`
    pointer-events: none;
    position: absolute;
    top: 0;
    left: 0;
    z-index: -1;
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
        this.container.appendChild(renderer.domElement);
        scene.add(camera);

        let renderStarfield = function () {
            requestAnimationFrame(renderStarfield);
            renderer.render(scene, camera);
        };

        renderStarfield();
    }

    render() {
        return (
            <Container ref={node => this.container = node} />
        );
    }
}