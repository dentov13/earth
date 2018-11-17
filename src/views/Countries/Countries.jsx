import React, { Component } from 'react';
import styled from 'styled-components';

const CountriesGrid = styled.div`
    z-index: 5;
    width: 50vw;
    height: 50vh;
    display: flex;
    flex-flow: row wrap;
    justify-content: flex-start;
    position: absolute;
    top: 50%;
    right: 0;
    transform: translateY(-50%);
    background: tomato;
    border-radius: 10px 0 0 10px;
    padding: 30px;
    opacity: .3;
`;

export default class Countries extends Component {
    render() {
        return (
            <CountriesGrid />
        );
    }
}