import React, { Component } from 'react';
import styled from 'styled-components';
import bg from 'assets/images/starfield.png';

const Background = styled.div`
    background: url(${bg}) no-repeat center center;
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0;
    left: 0;
`;

export default class Starfield extends Component {
    render() {
        return (
            <Background />
        );
    }
}