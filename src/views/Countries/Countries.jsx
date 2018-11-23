import React, { Component } from 'react';
import { _size, _import } from 'helpers/';
import styled from 'styled-components';

const CountriesGrid = styled.div`
    z-index: 5;
    width: 50vw;
    height: 50vh;
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    position: absolute;
    top: 50%;
    right: 0;
    transform: translateY(-50%);
    background: rgba(255,255,255,.1);
    border-radius: ${_size(10)} 0 0 ${_size(10)};
    padding: ${_size(30)};
    opacity: ${(props) => props.disabled ? '0.3' : '1'};
`;

const Country = styled.div`
    text-align: center;
    padding: ${_size(5)};
    cursor: pointer;
`;

const CountryTitle = styled.p`
    color: white;
    margin: ${_size(10)} 0;
`;
export default class Countries extends Component {
    render() {
        const icons = _import(require.context('assets/icons/', false, /\.svg$/));

        return (
            <CountriesGrid>
                {icons && icons.map((path, index) => {
                    let parseName = path => path.split('/').pop().split('.')[0];

                    return (
                        <Country key={index}>
                            <img src={path} width="107" height="70" alt={parseName(path)} />
                            <CountryTitle>{parseName(path).toUpperCase()}</CountryTitle>
                        </Country>
                    );
                })}
            </CountriesGrid>
        );
    }
}