import React, { Component } from 'react';
import _import from 'helpers';
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
    background: ${props => props.blue ? 'blue' : 'red'};
    border-radius: 10px 0 0 10px;
    padding: 30px;
    opacity: .3;
`;

const Country = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: space-between;
`;
export default class Countries extends Component {
    render() {
        const icons = _import(require.context('assets/icons/', false, /\.svg$/));

        return (
            <CountriesGrid>
                {icons && icons.map((path, index) => {
                    let parseName = x => x.split('/').pop().split('.')[0];

                    return (
                        <Country key={index}>
                            <img src={path} alt={parseName(path)} />
                            <p>{parseName(path).toUpperCase()}</p>
                        </Country>
                    );
                })}
            </CountriesGrid>
        );
    }
}