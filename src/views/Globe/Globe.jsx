import React, { Component } from 'react';
import styled from 'styled-components';
import earth from 'libs/Earth';
import * as d3 from 'd3';

import texture from 'assets/images/earth.jpg';

const GlobeCanvas = styled.canvas`
    position: absolute;
    top: 0;
    left: 0;
    transform: translateX(-37.5%);
`;
export default class Globe extends Component {
    componentDidMount() {
        const { offsetWidth, offsetHeight } = d3.select('body').node();
        const g = earth({ width: offsetWidth, height: offsetHeight, padding: 10 }).register(earth.plugins.selectCountryMix()).register(earth.plugins.imageThreejs(texture))

        g.inertiaPlugin.selectAll('#globe');
        g.ready(function () {
            g.create();
            g.selectCountryMix.multiRegion([{ color: 'transparent', borderColor: 'transparent', borderWidth: 0, countries: [784] }], 784);
            g._.options.spin = true;
        });

        // const initialScale = g._.proj.scale();
        // const scaleTo = (animation) => {
        //     const start = performance.now();

        //     requestAnimationFrame(function animate(time) {
        //         let timePassed = time - start;

        //         if (timePassed >= 1000) timePassed = 1000;

        //         animation(timePassed);

        //         if (timePassed < 1000) {
        //             requestAnimationFrame(animate);
        //         } else {
        //             document.querySelector('.globe-shadow').style.opacity = "1";
        //         }
        //     });
        // };

        // const scaleToCallback = (country, id, scale, needToCentered = true) => {
        //     document.querySelector('.country-grid').classList.add('country-grid--disabled');

        //     if ((g._.proj.scale() - initialScale) > 10) {
        //         document.querySelector('.globe-shadow').style.opacity = "0";

        //         setTimeout(() => scaleTo(timePassed => {
        //             const timeToScale = g._.proj.scale() - (timePassed / 1000 * g._.proj.scale())

        //             if (timeToScale > 0 && initialScale - timeToScale < 50) {
        //                 g._.scale(timeToScale)
        //             }
        //         }), 500);

        //         setTimeout(() => {
        //             g._.scale(initialScale)
        //         }, 500);

        //         setTimeout(() => {
        //             g.selectCountryMix.multiRegion(country, id);
        //         }, 1250);
        //     } else {
        //         g._.scale(initialScale)
        //         g.selectCountryMix.multiRegion(country, id);
        //     }

        //     needToCentered && setTimeout(() => {
        //         document.querySelector('.globe-shadow').style.opacity = "0";
        //         document.querySelector('.country-grid').classList.add('country-grid--translated');
        //         document.getElementById('three-js').classList.add('globe-centered');
        //         document.querySelector('.globe-shadow').classList.add('globe-shadow--centered');
        //         document.querySelector('.ej-canvas').classList.add('ej-canvas--centered');
        //         document.querySelector('.reset').classList.remove('reset--translated');
        //     }, 1250);

        //     needToCentered && setTimeout(() => {
        //         scaleTo(timePassed => {
        //             const timeToScale = timePassed / 1000 * scale;
        //             if (timePassed > 0 && timeToScale >= initialScale) {
        //                 g._.scale(timeToScale)
        //             }
        //         });
        //     }, 2000)

        //     setTimeout(() => document.querySelector('.country-grid').classList.remove('country-grid--disabled'), 4000)
        // }
    }

    render() {
        return <GlobeCanvas id="globe" />
    }
}