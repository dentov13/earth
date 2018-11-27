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
        const g = earth({ width: offsetWidth, height: offsetHeight, padding: 10 })
            .register(earth.plugins.selectCountryMix())
            .register(earth.plugins.imageThreejs(texture));

        g.inertiaPlugin.selectAll('#globe');
        g.create();
        g._.options.spin = true;
    }

    render() {
        return <GlobeCanvas id="globe" />
    }
}