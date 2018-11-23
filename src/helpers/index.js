const _import = (r) => {
    return r.keys().map(r);
}

const _size = (fontSize) => {
    return (fontSize / 1920) * window.innerWidth + 'px';
}

export { _import, _size };