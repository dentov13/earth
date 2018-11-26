import * as THREE from 'three';
import * as d3 from 'd3';
import * as d3_queue from 'd3-queue';
import * as topojson from 'topojson';

window.coordinates = {};

var earthjs = (function () {

    var versorFn = (function () {
        var acos = Math.acos,
            asin = Math.asin,
            atan2 = Math.atan2,
            cos = Math.cos,
            max = Math.max,
            min = Math.min,
            PI = Math.PI,
            sin = Math.sin,
            sqrt = Math.sqrt,
            radians = PI / 180,
            degrees = 180 / PI;

        function versor(e) {
            var l = e[0] / 2 * radians,
                sl = sin(l),
                cl = cos(l),
                p = e[1] / 2 * radians,
                sp = sin(p),
                cp = cos(p),
                g = e[2] / 2 * radians,
                sg = sin(g),
                cg = cos(g);
            return [cl * cp * cg + sl * sp * sg, sl * cp * cg - cl * sp * sg, cl * sp * cg + sl * cp * sg, cl * cp * sg - sl * sp * cg];
        }

        versor.cartesian = function (e) {
            var l = e[0] * radians,
                p = e[1] * radians,
                cp = cos(p);
            return [cp * cos(l), cp * sin(l), sin(p)];
        };

        versor.rotation = function (q) {
            return [atan2(2 * (q[0] * q[1] + q[2] * q[3]), 1 - 2 * (q[1] * q[1] + q[2] * q[2])) * degrees, asin(max(-1, min(1, 2 * (q[0] * q[2] - q[3] * q[1])))) * degrees, atan2(2 * (q[0] * q[3] + q[1] * q[2]), 1 - 2 * (q[2] * q[2] + q[3] * q[3])) * degrees];
        };

        versor.delta = function (v0, v1) {
            var w = cross(v0, v1),
                l = sqrt(dot(w, w));
            if (!l) return [1, 0, 0, 0];
            var t = acos(max(-1, min(1, dot(v0, v1)))) / 2,
                s = sin(t);
            return [cos(t), w[2] / l * s, -w[1] / l * s, w[0] / l * s];
        };

        versor.multiply = function (q0, q1) {
            return [q0[0] * q1[0] - q0[1] * q1[1] - q0[2] * q1[2] - q0[3] * q1[3], q0[0] * q1[1] + q0[1] * q1[0] + q0[2] * q1[3] - q0[3] * q1[2], q0[0] * q1[2] - q0[1] * q1[3] + q0[2] * q1[0] + q0[3] * q1[1], q0[0] * q1[3] + q0[1] * q1[2] - q0[2] * q1[1] + q0[3] * q1[0]];
        };

        function cross(v0, v1) {
            return [v0[1] * v1[2] - v0[2] * v1[1], v0[2] * v1[0] - v0[0] * v1[2], v0[0] * v1[1] - v0[1] * v1[0]];
        }

        function dot(v0, v1) {
            return v0[0] * v1[0] + v0[1] * v1[1] + v0[2] * v1[2];
        }

        return versor;
    });

    var versor = versorFn();

    var earthjs$2 = function earthjs() {
        var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

        cancelAnimationFrame(earthjs.ticker);
        options = Object.assign({
            svgCanvasSelector: '.ej-svg,.ej-canvas',
            selector: '#earth-js',
            rotate: [130, -33, -11],
            transparent: false,
            map: false,
            padding: 0
        }, options);
        var _ = {
            onCreate: {},
            onCreateCall: 0,
            onCreateVals: [],

            onRefresh: {},
            onRefreshVals: [],

            onResize: {},
            onResizeVals: [],

            onInterval: {},
            onIntervalVals: [],

            onTween: {},
            onTweenVals: [],

            ready: null,
            plugins: [],
            promeses: [],
            loadingData: null,
            recreateSvgOrCanvas: function recreateSvgOrCanvas(allPlugins) {
                if (allPlugins) {
                    globe.__plugins().forEach(function (g) {
                        g.__on__.onCreate.call(globe);
                    });
                } else {
                    _.onCreateVals.forEach(function (fn) {
                        fn.call(globe);
                    });
                }
                if (_.onCreateCall === 0) {
                    var plugins = Object.keys(_.onCreate).map(function (s) {
                        return globe[s];
                    }).filter(function (g) {
                        return g.__name__.match(/^((?!threejs).)*$/i);
                    });
                    _.onCreate = {};
                    plugins.forEach(function (g) {
                        return _.onCreate[g.name] = g.__on__.onCreate;
                    });
                    _.onCreateVals = Object.keys(_.onCreate).map(function (k) {
                        return _.onCreate[k];
                    });
                }
                _.onCreateCall++;
                return globe;
            }
        };
        window._ = _;
        var drag = false;
        var svg = d3.selectAll(options.selector);
        // var width = +svg.attr('width'),
        //     height = +svg.attr('height');
        // if (!width || !height) {
        /* SMTHNG WEIRD */
        var width = options.width / 2 || 700;
        // width = options.width || 700;
        var height = options.height || 500;
        /* SMTHNG WEIRD */
        // svg.attr('width', width * 4).attr('height', height);
        // }
        /* SMTHNG WEIRD */
        d3.selectAll(options.svgCanvasSelector).attr('width', width * 4).attr('height', height);
        var center = [width / 2, height / 2];
        Object.defineProperty(options, 'width', {
            get: function get() {
                return width * 4;
            },
            set: function set(x) {
                width = x;
                center[0] = x / 2;
            }
        });
        Object.defineProperty(options, 'height', {
            get: function get() {
                return height;
            },
            set: function set(x) {
                height = x;
                center[1] = x / 2;
            }
        });

        var globe = {
            _: {
                svg: svg,
                drag: drag,
                versor: versor,
                center: center,
                options: options
            },
            $slc: {},
            ready: function ready(fn) {
                debugger;
                if (fn) {
                    globe._.readyFn = fn;
                    globe._.promeses = _.promeses;
                    if (_.promeses.length > 0) {
                        var q = d3_queue.queue();
                        _.loadingData = true;
                        _.promeses.forEach(function (obj) {
                            obj.urls.forEach(function (url) {
                                var ext = void 0;
                                var match = url.match(/\.(geojson|json|csv|tsv)$/);
                                if (obj.urlType && !match) {
                                    ext = obj.urlType;
                                } else {
                                    ext = match[1];
                                    if (ext === 'geojson') {
                                        ext = 'json';
                                    }
                                }
                                q.defer(d3[ext], url);
                            });
                        });
                        q.await(function () {
                            var args = [].slice.call(arguments);
                            var err = args.shift();
                            _.promeses.forEach(function (obj) {
                                var ln = obj.urls.length;
                                var ar = args.slice(0, ln);
                                var ready = globe[obj.name].ready;
                                ar.unshift(err);
                                debugger;
                                if (ready) {
                                    ready.apply(globe, ar);
                                } else {
                                    obj.onReady.apply(globe, ar);
                                }
                                args = args.slice(ln);
                            });
                            _.loadingData = false;
                            fn.called = true;
                            fn.call(globe);
                        });
                    }
                } else if (arguments.length === 0) {
                    return _.loadingData;
                }
            },
            register: function register(obj, name) {
                var ar = {
                    name: name || obj.name,
                    __name__: obj.name,
                    __on__: {}
                };
                _.plugins.push(ar);
                globe[ar.name] = ar;
                Object.keys(obj).forEach(function (fn) {
                    if (['urls', 'onReady', 'onInit', 'onTween', 'onCreate', 'onResize', 'onRefresh', 'onInterval'].indexOf(fn) === -1) {
                        if (typeof obj[fn] === 'function') {
                            ar[fn] = function () {
                                return obj[fn].apply(globe, arguments);
                            };
                        }
                    }
                });
                if (obj.onInit) {
                    obj.onInit.call(globe, ar);
                }
                qEvent(obj, 'onTween', ar.name);
                qEvent(obj, 'onCreate', ar.name);
                qEvent(obj, 'onResize', ar.name);
                qEvent(obj, 'onRefresh', ar.name);
                qEvent(obj, 'onInterval', ar.name);
                if (obj.urls && obj.onReady) {
                    _.promeses.push({
                        name: ar.name,
                        urls: obj.urls,
                        urlType: obj.urlType,
                        onReady: obj.onReady
                    });
                }
                return globe;
            }
        };
        Object.defineProperty(globe, 'loading', {
            get: function get() {
                return _.loadingData;
            }
        });

        var earths = [];
        var ticker = null;
        var __ = globe._;

        globe.create = function (twinEarth) {
            var allPlugins = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

            earths = twinEarth || [];
            _.recreateSvgOrCanvas(allPlugins);
            earths.forEach(function (p) {
                p.create(null);
            });
            if (ticker === null && earths !== []) {
                __.ticker();
            }
            return globe;
        };

        globe.$slc.defs = __.svg.append('defs');
        __.ticker = function (intervalTicker) {
            var interval = __.interval;
            intervalTicker = intervalTicker || 10;

            var l1 = void 0,
                start1 = 0,
                p = void 0;
            var l2 = void 0,
                start2 = 0,
                fn = void 0;
            function step(timestamp) {
                if (timestamp - start1 > intervalTicker) {
                    start1 = timestamp;
                    if (!_.loadingData) {
                        interval.call(globe, timestamp);
                        if (timestamp - start2 > intervalTicker + 30) {
                            start2 = timestamp;

                            l2 = l1 = earths.length;
                            while (l1) {
                                p = earthjs[l2 - l1];
                                p._.interval.call(p, timestamp);
                                l1--;
                            }
                        }
                    }
                }

                l2 = l1 = _.onTweenVals.length;
                while (l1) {
                    fn = _.onTweenVals[l2 - l1];
                    fn && fn.call(globe, timestamp);
                    l1--;
                }
                earthjs.ticker = requestAnimationFrame(step);
            }

            earthjs.ticker = requestAnimationFrame(step);
            return globe;
        };

        __.scale = function (y) {
            __.proj.scale(y);
            __.resize();
            __.refresh();
            return globe;
        };

        __.rotate = function (r) {
            __.proj.rotate(r);
            __.refresh();
            return globe;
        };

        __.interval = function (t) {
            var l = _.onIntervalVals.length;
            while (l--) {
                _.onIntervalVals[l].call(globe, t);
            }
            return globe;
        };

        __.refresh = function (filter) {
            var l2 = void 0,
                l1 = void 0;
            if (filter) {
                var keys = filter ? _.onRefreshKeys.filter(function (d) {
                    return filter.test(d);
                }) : _.onRefreshKeys;
                keys.forEach(function (fn) {
                    _.onRefresh[fn].call(globe);
                });
            } else {
                l2 = l1 = _.onRefreshVals.length;
                while (l1) {
                    _.onRefreshVals[l2 - l1].call(globe);
                    l1--;
                }
            }

            // var shadow = document.querySelector('.globe-shadow');
            // shadow.style.width = this.proj.scale() * 2 + 'px';
            // shadow.style.height = this.proj.scale() * 2 + 'px';

            return globe;
        };

        __.resize = function () {
            var l2 = void 0,
                l1 = void 0;
            l2 = l1 = _.onResizeVals.length;
            while (l1) {
                _.onResizeVals[l2 - l1].call(globe);
                l1--;
            }

            return globe;
        };

        __.projection = function () {
            var _$options = __.options,
                scale = _$options.scale,
                width = _$options.width / 1.25,
                height = _$options.height / 1.25,
                padding = _$options.padding;

            if (__.options.map) {
                if (!scale) {
                    scale = width / 6.279 - padding;
                }
                return d3.geoEquirectangular().translate(__.center).precision(0.1).scale(scale);
            } else {
                if (!scale) {
                    var mins = d3.min([width, height]);
                    scale = mins / 2 - padding;
                }
                var r = __.options.rotate;
                if (typeof r === 'number') {
                    __.options.rotate = [r, -33, -11];
                }
                return d3.geoOrthographic().rotate(__.options.rotate).translate(__.center).precision(0.1).clipAngle(90).scale(scale);
            }
        };

        __.proj = __.projection();
        __.path = d3.geoPath().projection(__.proj);

        globe.__addEventQueue = function (name, qname) {
            var obj = globe[name].__on__;
            if (qname) {
                AddQueueEvent(obj, qname, name);
            } else {
                obj && Object.keys(obj).forEach(function (qname) {
                    return AddQueueEvent(obj, qname, name);
                });
            }
        };
        globe.__removeEventQueue = function (name, qname) {
            var obj = globe[name].__on__;
            if (obj) {
                if (qname) {
                    delete _[qname][name];
                    _[qname + 'Keys'] = Object.keys(_[qname]);
                    _[qname + 'Vals'] = _[qname + 'Keys'].map(function (k) {
                        return _[qname][k];
                    });
                } else {
                    Object.keys(obj).forEach(function (qname) {
                        delete _[qname][name];
                        _[qname + 'Keys'] = Object.keys(_[qname]);
                        _[qname + 'Vals'] = _[qname + 'Keys'].map(function (k) {
                            return _[qname][k];
                        });
                    });
                }
            }
        };
        globe.__plugins = function (filter) {
            if (filter === undefined) {
                return _.plugins;
            } else {
                return _.plugins.filter(function (obj) {
                    return obj.__name__.match(filter);
                });
            }
        };
        return globe;

        function AddQueueEvent(obj, qname, name) {
            _[qname][name] = obj[qname];
            _[qname + 'Keys'] = Object.keys(_[qname]);
            _[qname + 'Vals'] = _[qname + 'Keys'].map(function (k) {
                return _[qname][k];
            });
        }
        function qEvent(obj, qname, name) {
            if (obj[qname]) {
                globe[name].__on__[qname] = obj[qname];
                AddQueueEvent(obj, qname, name);
            }
        }
    };
    if (window.d3 === undefined) {
        window.d3 = {};
    }
    window.d3.earthjs = earthjs$2;

    var worldJson = (function (jsonUrl) {
        var _ = {
            world: null,
            selected: { type: 'FeatureCollection', features: [] },
            countries: { type: 'FeatureCollection', features: [] }
        };

        return {
            name: 'worldJson',
            urls: jsonUrl && [jsonUrl],
            onReady: function onReady(err, json) {
                _.me.data(json);
            },
            onInit: function onInit(me) {
                _.me = me;
            },
            data: function data(_data) {
                if (_data) {
                    _.world = _data;
                    _.countries.features = topojson.feature(_data, _data.objects.countries).features;
                } else {
                    return _.world;
                }
            },
            allData: function allData(all) {
                if (all) {
                    _.world = all.world;
                    _.countries = all.countries;
                } else {
                    var world = _.world,
                        countries = _.countries;

                    return { world: world, countries: countries };
                }
            },
            countries: function countries(arr) {
                if (arr) {
                    _.countries.features = arr;
                } else {
                    return _.countries.features;
                }
            }
        };
    });

    var hoverCanvas = (function () {
        var _ = {
            svg: null,
            mouse: null,
            country: null,
            ocountry: null,
            countries: null,
            hoverHandler: null,
            onCircle: {},
            onCircleVals: [],
            onCountry: {},
            onCountryVals: []
        };

        function init() {
            if (this.worldCanvas) {
                var world = this.worldCanvas.data();
                if (world) {
                    _.world = world;
                    _.countries = topojson.feature(world, world.objects.countries);
                }
            }
            var __ = this._;
            var _this = this;
        }

        return {
            name: 'hoverCanvas',
            onInit: function onInit(me) {
                _.me = me;
                _.svg = this._.svg;
                this._.options.showSelectedCountry = false;
                init.call(this);
            },
            selectAll: function selectAll(q) {
                if (q) {
                    _.q = q;
                    _.svg.on('mousemove', null);
                    _.svg = d3.selectAll(q);
                    init.call(this);
                }
                return _.svg;
            },
            onCreate: function onCreate() {
                if (this.worldJson && !_.world) {
                    _.me.data(this.worldJson.data());
                }
            },
            onCircle: function onCircle(obj) {
                Object.assign(_.onCircle, obj);
                _.onCircleVals = Object.keys(_.onCircle).map(function (k) {
                    return _.onCircle[k];
                });
            },
            onCountry: function onCountry(obj) {
                Object.assign(_.onCountry, obj);
                _.onCountryVals = Object.keys(_.onCountry).map(function (k) {
                    return _.onCountry[k];
                });
            },
            data: function data(_data) {
                if (_data) {
                    _.world = _data;
                    _.countries = topojson.feature(_data, _data.objects.countries);
                } else {
                    return _.world;
                }
            },
            allData: function allData(all) {
                if (all) {
                    _.world = all.world;
                    _.countries = all.countries;
                } else {
                    var world = _.world,
                        countries = _.countries;

                    return { world: world, countries: countries };
                }
            },
            states: function states() {
                return {
                    pos: _.pos,
                    dot: _.dot,
                    mouse: _.mouse,
                    country: _.country
                };
            }
        };
    });

    var canvasPlugin = (function () {
        var _ = {
            contexts: [],
            canvas: null,
            path: null,
            q: null
        };
        var $ = {};

        function init() {
            var __ = this._;
            __.options.showCanvas = true;
            _.path = d3.geoPath().projection(__.proj);
        }

        function create() {
            var __ = this._;
            if (__.options.showCanvas) {
                if (!_.canvas) {
                    $.g = __.svg.append('g').attr('class', _.me.name);
                    var fObject = $.g.append('foreignObject').attr('x', 0).attr('y', 0).attr('width', __.options.width).attr('height', __.options.height);
                    var fBody = fObject.append('xhtml:body').style('margin', '0px').style('padding', '0px').style('background-color', 'none').style('width', __.options.width + 'px').style('height', __.options.height + 'px');
                    _.canvas = fBody.append('canvas');
                }
                _.canvas.attr('x', 0).attr('y', 0).attr('width', __.options.width).attr('height', __.options.height);
                _.contexts = _.canvas.nodes().map(function (obj) {
                    return obj.getContext('2d');
                });
            }
            if (_.canvas) {
                refresh.call(this);
            }
        }

        function refresh() {
            var _$options = this._.options,
                width = _$options.width,
                height = _$options.height;

            var l = _.contexts.length;
            while (l--) {
                _.contexts[l].clearRect(0, 0, width, height);
            }
        }

        return {
            name: 'canvasPlugin',
            onInit: function onInit(me) {
                _.me = me;
                init.call(this);
            },
            onCreate: function onCreate() {
                create.call(this);
            },
            onRefresh: function onRefresh() {
                refresh.call(this);
            },
            selectAll: function selectAll(q) {
                if (q) {
                    _.q = q;
                    _.canvas = d3.selectAll(q);
                }
                return _.canvas;
            },
            render: function render(fn, drawTo) {
                var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : [];

                var __ = this._;
                if (__.options.showCanvas) {
                    var rChange = false;
                    var proj = __.proj;
                    var r = proj.rotate();

                    // camera.position.set(r[0] / 6, r[1] / 6, 0);

                    var _this = this;
                    _.canvas.each(function (obj, idx) {
                        if (!drawTo || drawTo.indexOf(idx) > -1) {
                            var o = options[idx] || {};
                            if (o.rotate) {
                                rChange = true;
                                proj.rotate([r[0] + o.rotate, r[1], r[2]]);
                            } else if (rChange) {
                                rChange = false;
                                proj.rotate(r);
                            }
                            var context = this.getContext('2d');
                            fn.call(_this, context, _.path.context(context));
                        }
                    });
                    if (rChange) {
                        rChange = false;
                        proj.rotate(r);
                    }
                }
            },
            flipRender: function flipRender(fn, drawTo) {
                var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : [];

                var __ = this._;
                var w = __.center[0];
                var r = __.proj.rotate();
                _.me.render(function (context, path) {
                    context.save();
                    context.translate(w, 0);
                    context.scale(-1, 1);
                    context.translate(-w, 0);
                    __.proj.rotate([r[0] + 180, -r[1], -r[2]]);
                    fn.call(this, context, path);
                    context.restore();
                    __.proj.rotate(r);
                }, drawTo, options);
            }
        };
    });

    var inertiaPlugin = (function () {
        var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : { zoomScale: [0, 50000] };

        var _ = {
            sync: [],
            onDrag: {},
            onDragVals: [],
            onDragStart: {},
            onDragStartVals: [],
            onDragEnd: {},
            onDragEndVals: [],
            onClick: {},
            onClickVals: [],
            onDblClick: {},
            onDblClickVals: [],
            stalledDrag: 0
        };

        var rotateX = 0,
            rotateY = 0,
            rotateZ = [],
            rotateVX = 0,
            rotateVY = 0,
            previousX = 0,
            previousY = 0;

        var dragging = false,
            rendering = false,
            draggMove = undefined;

        function onclick() {
            _.onClickVals.forEach(function (v) {
                v.call(_._this, _.event, _.mouse);
            });
        }

        function ondblclick() {
            _.onDblClickVals.forEach(function (v) {
                v.call(_._this, _.event, _.mouse);
            });
        }

        function stopDrag() {
            var _this = this;

            _.this._.drag = false;
            _.this._.refresh();
            _.onDragEndVals.forEach(function (v) {
                return v.call(_this, _.event, _.mouse);
            });
        }

        var scaleX = d3.scaleLinear().domain([65.3, 184.5]).range([0.60, 0.25]);
        var scaleY = d3.scaleLinear().domain([65.3, 184.5]).range([0.55, 0.20]);

        function inertiaDrag() {
            var _this2 = this;

            _.onDragVals.forEach(function (v) {
                return v.call(_this2, _.event, _.mouse);
            });
            if (!rendering) {
                _.removeEventQueue(_.me.name, 'onTween');
                stopDrag();
                return;
            }

            rotateVX *= 0.99;
            rotateVY *= 0.90;

            if (dragging) {
                rotateVX *= _.dragX;
                rotateVY *= _.dragY;
            }

            if (rotateY < -100) {
                rotateY = -100;
                rotateVY *= -0.95;
            }

            if (rotateY > 100) {
                rotateY = 100;
                rotateVY *= -0.95;
            }

            rotateX += rotateVX;
            rotateY += rotateVY;

            var r = [rotateX, rotateY, rotateZ[2]];
            var l = _.sync.length;

            _.rotate(r);

            while (l--) {
                _.sync[l]._.rotate(r);
            }

            if (!dragging && previousX.toPrecision(5) === rotateX.toPrecision(5) && previousY.toPrecision(5) === rotateY.toPrecision(5)) {
                rendering = false;
            }
            previousX = rotateX;
            previousY = rotateY;
        }

        function mouseMovement() {
            _.event = d3.event;
            _.mouse = d3.mouse(this);
            var sourceEvent = _.event.sourceEvent;

            if (sourceEvent) {
                var t = sourceEvent.touches ? sourceEvent.touches[0] : sourceEvent;
                return [t.clientX, -t.clientY];
            }
        }

        var cmouse = void 0,
            pmouse = void 0;
        function onStartDrag() {
            var _this3 = this;

            rotateVX = 0;
            rotateVY = 0;
            dragging = true;
            rendering = true;
            draggMove = null;
            cmouse = mouseMovement.call(this);
            _.onDragStartVals.forEach(function (v) {
                return v.call(_this3, _.event, _.mouse);
            });
            _.onDragVals.forEach(function (v) {
                return v.call(_this3, _.event, _.mouse);
            });
            _.removeEventQueue(_.me.name, 'onTween');
            _.addEventQueue(_.me.name, 'onInterval');
            _.this._.drag = null;
        }

        function onDragging() {
            if (dragging) {
                draggMove = true;
                pmouse = cmouse;
                cmouse = mouseMovement.call(this);
                if (cmouse) {
                    rotateZ = _.proj.rotate();
                    rotateX = rotateZ[0];
                    rotateY = rotateZ[1];
                    rotateVX += cmouse[0] - pmouse[0];
                    rotateVY += cmouse[1] - pmouse[1];
                    inertiaDrag.call(_.this);
                } else {
                    cmouse = pmouse;
                }
                _.this._.drag = true;
                _.stalledDrag = 0;
                _._this = this;
            }
        }

        function init() {
            var __ = this._;
            var s0 = __.proj.scale();
            function zoomAndDrag() {
                var _d3$event$sourceEvent = d3.event.sourceEvent;

                if (!!_d3$event$sourceEvent) {
                    var type = _d3$event$sourceEvent.type,
                        touches = _d3$event$sourceEvent.touches;

                    if (type === 'wheel' || touches && touches.length === 2) {
                        // prevent user zoom
                        // var r1 = s0 * d3.event.transform.k;
                        // if (r1 >= zoomScale[0] && r1 <= zoomScale[1]) {
                        //     var l = _.sync.length;
                        //     __.scale(r1);
                        //     while (l--) {
                        //         _.sync[l]._.scale(r1);
                        //     }
                        // }
                        // rotateVX = 0;
                        // rotateVY = 0;
                    } else {
                        // onDragging.call(this);
                    }
                }
            }

            // var _$options = __.options,
            //     width = _$options.width,
            //     height = _$options.height;

            // _.svg.call(d3.zoom().on("start", onStartDrag).on('zoom', zoomAndDrag).on("end", onEndDrag).scaleExtent([0.1, 160]).translateExtent([[0, 0], [width, height]]));
        }

        function create() {
            _.proj = this._.proj;
            _.rotate = this._.rotate;
            _.addEventQueue = this.__addEventQueue;
            _.removeEventQueue = this.__removeEventQueue;
            _.removeEventQueue(_.me.name, 'onInterval');
            var r = _.proj.scale();
            r = r > 200 ? 200 : r;
            _.dragX = scaleX(r);
            _.dragY = scaleY(r);
        }

        function resize() {
            var r = _.proj.scale();
            r = r > 200 ? 200 : r;
            _.dragX = scaleX(r);
            _.dragY = scaleY(r);
        }

        return {
            name: 'inertiaPlugin',
            onInit: function onInit(me) {
                _.me = me;
                _.this = this;
                _.svg = this._.svg;
                init.call(this);
            },
            onCreate: function onCreate() {
                create.call(this);
            },
            onResize: function onResize() {
                resize.call(this);
            },
            selectAll: function selectAll(q) {
                // ? 
            },
            onInterval: function onInterval() {
                // ?
            },
            onTween: function onTween() {
                // ?
            },
            sync: function sync(arr) {
                _.sync = arr;
            },
            onDrag: function onDrag(obj) {
                // ?
            },
            onDragStart: function onDragStart(obj) {
                // ?
            },
            onDragEnd: function onDragEnd(obj) {
                // ?
            },
            stopDrag: function stopDrag() {
                // ?
            },
            onClick: function onClick(obj) {
                // ?
            },
            onDblClick: function onDblClick(obj) {
                // ?
            }
        };
    });

    var threejsPlugin = (function () {
        var threejs = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'three-js';

        var _ = { renderer: null, scene: null, camera: null };
        var manager = new THREE.LoadingManager();
        var loader = new THREE.TextureLoader(manager);
        var SCALE = void 0;

        // manager.onLoad = function () {
        //     parseInt(document.querySelector('.progress__bar').style.width) < 75 ? document.querySelector('.progress__bar').style.width = "75%" : null

        //     setTimeout(() => {
        //         parseInt(document.querySelector('.progress__bar').style.width) < 90 ? document.querySelector('.progress__bar').style.width = "90%" : null
        //     }, 1000);

        //     setTimeout(() => {
        //         parseInt(document.querySelector('.progress__bar').style.width) < 100 ? document.querySelector('.progress__bar').style.width = "100%" : null
        //         document.querySelector('.loader').style.opacity = "0"
        //         document.querySelector('.country-grid').style.opacity = "1"
        //     }, 4000);
        // }

        function _vertex(point, r) {
            var lambda = point[0] * Math.PI / 180,
                phi = point[1] * Math.PI / 180,
                cosPhi = Math.cos(phi);
            return new THREE.Vector3(r * cosPhi * Math.cos(lambda), r * Math.sin(phi), -r * cosPhi * Math.sin(lambda));
        }

        function _wireframe(multilinestring, material, r) {
            var geometry = new THREE.Geometry();
            multilinestring.coordinates.forEach(function (line) {
                d3.pairs(line.map(function (p) {
                    return _vertex(p, r);
                }), function (a, b) {
                    geometry.vertices.push(a, b);
                });
            });
            return new THREE.LineSegments(geometry, material);
        }

        function init() {
            var __ = this._;
            SCALE = __.proj.scale();
            var _$options = __.options,
                width = _$options.width,
                height = _$options.height;

            var canvas = document.getElementById('globe');
            _.scale = d3.scaleLinear().domain([0, SCALE]).range([0, 1]);
            _.camera = new THREE.OrthographicCamera(-width / 2, width / 2, height / 2, -height / 2, 0.1, 30000);
            _.light = new THREE.PointLight(0xffffff, 5);
            _.scene = new THREE.Scene();
            _.group = new THREE.Group();
            _.node = canvas;
            _.camera.position.z = 3010;
            _.camera.name = 'camera';
            _.group.name = 'group';
            _.light.name = 'light';
            _.scene.add(_.camera);
            _.scene.add(_.group);
            _.camera.add(_.light);

            _.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, canvas: canvas });
            _.renderer.setClearColor(0x000000, 0);
            _.renderer.setSize(width, height);
            _.renderer.sortObjects = true;
            this.renderThree = _renderThree;
            if (window.THREEx && window.THREEx.DomEvents) {
                _.domEvents = new window.THREEx.DomEvents(_.camera, _.renderer.domElement);
            }

            Object.defineProperty(_.me, 'group', {
                get: function get() {
                    return _.group;
                }
            });
            Object.defineProperty(_.me, 'camera', {
                get: function get() {
                    return _.camera;
                }
            });
            Object.defineProperty(_.me, 'renderer', {
                get: function get() {
                    return _.renderer;
                }
            });
            Object.defineProperty(_.me, 'domEvents', {
                get: function get() {
                    return _.domEvents;
                }
            });
        }

        function _scale(obj) {
            if (!obj) {
                obj = _.group;
            }
            var sc = _.scale(this._.proj.scale());
            obj.scale.x = sc;
            obj.scale.y = sc;
            obj.scale.z = sc;
            _renderThree.call(this);
        }

        function _rotate(obj) {
            var direct = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
            var delay = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;

            var __ = this._;
            var rt = __.proj.rotate();
            rt[0] -= 90;
            var q1 = __.versor(rt);
            var q2 = new THREE.Quaternion(-q1[2], q1[1], q1[3], q1[0]);
            (obj || _.group).setRotationFromQuaternion(q2);
            _renderThree.call(this, direct, false, delay);
        }

        var renderThreeX = null;
        function _renderThree() {
            var _this = this;

            var direct = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;
            var fn = arguments[1];

            if (direct) {
                _.renderer.render(_.scene, _.camera);
                if (renderThreeX) {
                    renderThreeX = null;
                    clearTimeout(renderThreeX);
                }
            } else if (renderThreeX === null) {
                renderThreeX = setTimeout(function () {
                    fn && fn.call(_this, _.group);
                    _.renderer.render(_.scene, _.camera);
                    renderThreeX = null;
                }, 0);
            }
        }

        return {
            name: 'threejsPlugin',
            onInit: function onInit(me) {
                _.me = me;
                init.call(this);
            },
            onCreate: function onCreate() {
                _.group.children = [];
                _rotate.call(this);
            },
            onRefresh: function onRefresh() {
                _rotate.call(this, null, true);
            },
            onResize: function onResize() {
                _scale.call(this);
            },
            addGroup: function addGroup(obj) {
                var _this2 = this;

                _.group.add(obj);
                if (obj.name && this[obj.name]) {
                    this[obj.name].add = function () {
                        _.group.add(obj);
                        _this2.__addEventQueue(obj.name);
                        _renderThree.call(_this2);
                    };
                    this[obj.name].remove = function () {
                        _.group.remove(obj);
                        _this2.__removeEventQueue(obj.name);
                        _renderThree.call(_this2);
                    };
                    this[obj.name].isAdded = function () {
                        return _.group.children.filter(function (x) {
                            return x.name === obj.name;
                        }).length > 0;
                    };
                }
            },
            emptyGroup: function emptyGroup() {
                var arr = _.group.children;
                var ttl = arr.length;
                for (var i = ttl - 1; i > -1; --i) {
                    var obj = arr[i];
                    _.group.remove(obj);
                    obj.name && this.__removeEventQueue(obj.name);
                    _renderThree.call(this);
                }
            },
            scale: function scale(obj) {
                _scale.call(this, obj);
            },
            rotate: function rotate(obj) {
                _rotate.call(this, obj);
            },
            vertex: function vertex(point) {
                var r = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : SCALE;

                return _vertex(point, r);
            },
            wireframe: function wireframe(multilinestring, material) {
                var r = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : SCALE;

                return _wireframe(multilinestring, material, r);
            },
            texture: function texture(imgUrl) {
                var _this3 = this;

                return loader.load(imgUrl, function (image) {
                    _renderThree.call(_this3);
                    return image;
                });
            },
            renderThree: function renderThree() {
                _renderThree.call(this);
            },
            light: function light() {
                return _.camera.children[0];
            },
            node: function node() {
                return _.node;
            },
            q2rotate: function q2rotate() {
                var q = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : _.group.quaternion;

                var trans = [q._w, q._y, -q._x, q._z];
                var euler = this._.versor.rotation(trans);
                euler[0] += 90;
                return euler;
            },
            light3d: function light3d() {
                var sphereObject = new THREE.Group();
                var ambient = new THREE.AmbientLight(0x777777);
                var light1 = new THREE.DirectionalLight(0xffffff);
                var light2 = new THREE.DirectionalLight(0xffffff);
                light1.position.set(1, 0, 1);
                light2.position.set(-1, 0, 1);
                sphereObject.add(ambient);
                sphereObject.add(light1);
                sphereObject.add(light2);
                return sphereObject;
            }
        };
    });

    var autorotatePlugin = (function () {
        var degPerSec = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 4;

        var _ = {
            lastTick: new Date(),
            degree: degPerSec / 1000,
            sync: []
        };

        function create() {
            var o = this._.options;
            if (this.clickCanvas) {
                this.clickCanvas.onCountry({
                    autorotatePlugin: function autorotatePlugin(e, country) {
                        if (!country) {
                            o.spin = !o.spin;
                        }
                    }
                });
            }
        }

        var start = 0;
        function interval(timestamp) {
            if (timestamp - start > 10) {
                start = timestamp;
                var now = new Date();
                if (this._.options.spin && this._.drag === false) {
                    var delta = now - _.lastTick;
                    rotate.call(this, delta);
                    _.sync.forEach(function (g) {
                        return rotate.call(g, delta);
                    });
                }
                _.lastTick = now;
            }
        }

        function rotate(delta) {
            var r = this._.proj.rotate();
            r[0] += _.degree * delta;
            this._.rotate(r);
        }

        return {
            name: 'autorotatePlugin',
            onInit: function onInit(me) {
                _.me = me;
                this._.options.spin = true;
            },
            onCreate: function onCreate() {
                create.call(this);
            },
            onInterval: function onInterval(t) {
                interval.call(this, t);
            },
            speed: function speed(degPerSec) {
                _.degree = degPerSec / 1000;
            },
            sync: function sync(arr) {
                _.sync = arr;
            },
            start: function start() {
                this._.options.spin = true;
            },
            stop: function stop() {
                this._.options.spin = false;
            },
            spin: function spin(rotate) {
                if (rotate !== undefined) {
                    this._.options.spin = rotate;
                } else {
                    return this._.options.spin;
                }
            }
        };
    });

    var worldCanvas = (function (worldUrl) {

        var _ = {
            style: {},
            options: {},
            drawTo: null,
            world: null,
            land: null,
            lakes: { type: 'FeatureCollection', features: [] },
            countries: { type: 'FeatureCollection', features: [] },
            selected: { type: 'FeatureCollection', features: [], multiColor: false }
        };

        function create() {
            var _this = this;

            var __ = this._;
            if (_.world) {
                if (__.options.transparent || __.options.transparentLand) {
                    this.canvasPlugin.flipRender(function (context, path) {
                        context.beginPath();
                        path(_.land);
                        context.fillStyle = _.style.backLand || 'rgba(119,119,119,0.2)';
                        context.fill();
                    }, _.drawTo, _.options);
                }
                if (__.options.showLand) {
                    if (__.options.showCountries || _.me.showCountries) {
                        canvasAddCountries.call(this, __.options.showBorder);
                    } else {
                        canvasAddWorld.call(this);
                    }
                    if (!__.drag && __.options.showLakes) {
                        canvasAddLakes.call(this);
                    }
                } else if (__.options.showBorder) {
                    canvasAddCountries.call(this, true);
                }
                if (this.hoverCanvas && __.options.showSelectedCountry) {
                    if (_.selected.features.length > 0) {
                        if (!_.selected.multiColor) {
                            this.canvasPlugin.render(function (context, path) {
                                context.beginPath();
                                path(_.selected);
                                context.fillStyle = _.style.selected || 'rgba(87, 255, 99, 0.5)';
                                context.fill();
                            }, _.drawTo, _.options);
                        } else {
                            var l1 = _.selected.features.length;
                            var l2 = l1 - 1;

                            var _loop = function _loop() {
                                var scountry = _.selected.features[l2 - l1];
                                _this.canvasPlugin.render(function (context, path) {
                                    context.beginPath();
                                    path(scountry);

                                    let img = document.getElementById('pattern');
                                    let pattern = context.createPattern(img, 'repeat');

                                    context.fillStyle = scountry.color || pattern;
                                    context.strokeStyle = scountry.borderColor || '#0071b0';
                                    context.lineWidth = scountry.borderWidth || '3';

                                    context.fill();
                                    context.stroke();
                                }, _.drawTo, _.options);
                            };

                            while (l1--) {
                                _loop();
                            }
                        }
                    }
                }
            }
        }

        function canvasAddWorld() {
            this.canvasPlugin.render(function (context, path) {
                context.beginPath();
                path(_.land);
                context.fillStyle = _.style.land || 'rgba(2, 20, 37,0.8)';
                context.fill();
            }, _.drawTo, _.options);
        }

        function canvasAddCountries() {
            var border = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;

            this.canvasPlugin.render(function (context, path) {
                context.beginPath();
                path(_.countries);
                if (!border) {
                    context.fillStyle = _.style.countries || 'rgba(2, 20, 37,0.8)';
                    context.fill();
                }
                context.lineWidth = 0.1;
                context.strokeStyle = _.style.border || 'rgb(239, 237, 234)';
                context.stroke();
            }, _.drawTo, _.options);
        }

        function canvasAddLakes() {
            this.canvasPlugin.render(function (context, path) {
                context.beginPath();
                path(_.lakes);
                context.fillStyle = _.style.lakes || 'rgba(80, 87, 97, 0.5)';
                context.fill();
            }, _.drawTo, _.options);
        }

        return {
            name: 'worldCanvas',
            urls: worldUrl && [worldUrl],
            onReady: function onReady(err, data) {
                _.me.data(data);
            },
            onInit: function onInit(me) {
                _.me = me;
                var options = this._.options;
                options.showLand = false;
                options.showLakes = false;
                options.showBorder = false;
                options.showCountries = false;
                options.transparentLand = false;
                options.showDropShadow = true;
                options.showSelectedCountry = true;
            },
            onCreate: function onCreate() {
                var _this2 = this;

                if (this.worldJson && !_.world) {
                    _.me.allData(this.worldJson.allData());
                }
                create.call(this);
                if (this.hoverCanvas) {
                    var hover = {};
                    hover[_.me.name] = function () {
                        if (!_this2._.options.spin) {
                            _this2._.refresh();
                        }
                    };
                    this.hoverCanvas.onCountry(hover);
                }
            },
            onRefresh: function onRefresh() {
                create.call(this);
            },
            countries: function countries(arr) {
                if (arr) {
                    _.countries.features = arr;
                } else {
                    return _.countries.features;
                }
            },
            selectedCountries: function selectedCountries(arr) {
                var multiColor = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

                if (arr) {
                    _.selected.features = arr;
                    _.selected = { type: 'FeatureCollection', features: arr, multiColor: multiColor };
                } else {
                    return _.selected.features;
                }
            },
            data: function data(_data) {
                if (_data) {
                    _.world = _data;
                    _.countries.features = topojson.feature(_data, _data.objects.countries).features
                } else {
                    return _.world;
                }
            },
            allData: function allData(all) {
                if (all) {
                    _.world = all.world;
                    _.countries = all.countries;
                } else {
                    var world = _.world,
                        countries = _.countries;

                    return { world: world, countries: countries };
                }
            },
            drawTo: function drawTo(arr) {
                _.drawTo = arr;
            },
            style: function style(s) {
                if (s) {
                    _.style = s;
                }
                return _.style;
            },
            options: function options(_options) {
                _.options = _options;
            }
        };
    });

    var centerCanvas = (function () {
        var _ = { focused: null };

        function country(cnt, id) {
            id = ('' + id).replace('x', '');
            for (var i = 0, l = cnt.length; i < l; i++) {
                if (cnt[i].id == id) {
                    return cnt[i];
                }
            }
        }

        function transition(p) {
            var __ = this._;
            var r = d3.interpolate(__.proj.rotate(), [-p[0], -p[1], 0]);
            var x = function x(t) {
                return __.rotate(r(t));
            };
            d3.transition().duration(2000).tween('rotate', function () {
                return x;
            });
        }

        function scale(p) {
            var __ = this._;
        }

        function create() {
            var _this = this;
            if (this.clickCanvas) {
                // ?
            }
        }

        return {
            name: 'centerCanvas',
            onInit: function onInit(me) {
                _.me = me;
                this._.options.enableCenter = true;
            },
            onCreate: function onCreate() {
                create.call(this);
            },
            go: function go(id) {
                var c = this.worldCanvas.countries();
                var focusedCountry = country(c, id),
                    p = d3.geoCentroid(focusedCountry);
                if (this.inertiaPlugin) {
                    this.inertiaPlugin.stopDrag();
                }
                transition.call(this, p);
                scale.call(this, p);
            },
            focused: function focused(fn) {
                _.focused = fn;
            }
        };
    });

    var imageThreejs = (function () {
        var imgUrl = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '../globe/world.png';

        var _ = { sphereObject: null };

        function init() {
            var tj = this.threejsPlugin;
            _.material = new THREE.MeshBasicMaterial({
                map: tj.texture(imgUrl),
                side: THREE.FrontSide,
                transparent: true,
                alphaTest: 0.20
            });
            Object.defineProperty(_.me, 'transparent', {
                get: function get() {
                    return _.transparent;
                },
                set: function set(x) {
                    _.transparent = x;
                    if (x) {
                        _.material.side = THREE.DoubleSide;
                        _.material.alphaTest = 0.01;
                    } else {
                        _.material.side = THREE.FrontSide;
                        _.material.alphaTest = 0;
                    }
                    _.material.needsUpdate = true;
                }
            });
        }

        function create() {
            var tj = this.threejsPlugin;
            if (!_.sphereObject) {
                var r = this._.proj.scale() + (this.__plugins('3d').length > 0 ? 4 : 0);
                var geometry = new THREE.SphereGeometry(r, 30, 30);
                _.sphereObject = new THREE.Mesh(geometry, _.material);
                _.sphereObject.name = _.me.name;
                tj.addGroup(_.sphereObject);
            } else {
                tj.addGroup(_.sphereObject);
            }
        }

        return {
            name: 'imageThreejs',
            onInit: function onInit(me) {
                _.me = me;
                _.transparent = false;
                init.call(this);
            },
            onCreate: function onCreate() {
                create.call(this);
            },
            sphere: function sphere() {
                return _.sphereObject;
            }
        };
    });

    function Map3DGeometry(data, innerRadius) {
        /*eslint no-redeclare: 0 */
        if (arguments.length < 2 || isNaN(parseFloat(innerRadius)) || !isFinite(innerRadius) || innerRadius < 0) {
            // if no valid inner radius is given, do not extrude
            innerRadius = 42;
        }

        THREE.Geometry.call(this);
        // data.vertices = [lat, lon, ...]
        // data.polygons = [[poly indices, hole i-s, ...], ...]
        // data.triangles = [tri i-s, ...]
        var i,
            uvs = [];
        for (i = 0; i < data.vertices.length; i += 2) {
            var lon = data.vertices[i];
            var lat = data.vertices[i + 1];
            // colatitude
            var phi = +(90 - lat) * 0.01745329252;
            // azimuthal angle
            var the = +(180 - lon) * 0.01745329252;
            // translate into XYZ coordinates
            var wx = Math.sin(the) * Math.sin(phi) * -1;
            var wz = Math.cos(the) * Math.sin(phi);
            var wy = Math.cos(phi);
            // equirectangular projection
            var wu = 0.25 + lon / 360.0;
            var wv = 0.5 + lat / 180.0;

            this.vertices.push(new THREE.Vector3(wx, wy, wz));

            uvs.push(new THREE.Vector2(wu, wv));
        }

        var n = this.vertices.length;

        if (innerRadius <= 1) {
            for (i = 0; i < n; i++) {
                var v = this.vertices[i];
                this.vertices.push(v.clone().multiplyScalar(innerRadius));
            }
        }

        for (i = 0; i < data.triangles.length; i += 3) {
            var a = data.triangles[i];
            var b = data.triangles[i + 1];
            var c = data.triangles[i + 2];

            this.faces.push(new THREE.Face3(a, b, c, [this.vertices[a], this.vertices[b], this.vertices[c]]));
            this.faceVertexUvs[0].push([uvs[a], uvs[b], uvs[c]]);

            if (0 < innerRadius && innerRadius <= 1) {
                this.faces.push(new THREE.Face3(n + b, n + a, n + c, [this.vertices[b].clone().multiplyScalar(-1), this.vertices[a].clone().multiplyScalar(-1), this.vertices[c].clone().multiplyScalar(-1)]));
                this.faceVertexUvs[0].push([uvs[b], uvs[a], uvs[c]]); // shitty uvs to make 3js exporter happy
            }
        }

        // extrude
        if (innerRadius < 1) {
            for (i = 0; i < data.polygons.length; i++) {
                var polyWithHoles = data.polygons[i];
                for (var j = 0; j < polyWithHoles.length; j++) {
                    var polygonOrHole = polyWithHoles[j];
                    for (var k = 0; k < polygonOrHole.length; k++) {
                        var a = polygonOrHole[k],
                            b = polygonOrHole[(k + 1) % polygonOrHole.length];
                        var va1 = this.vertices[a],
                            vb1 = this.vertices[b];
                        var va2 = this.vertices[n + a]; //, vb2 = this.vertices[n + b];
                        var normal;
                        if (j < 1) {
                            // polygon
                            normal = vb1.clone().sub(va1).cross(va2.clone().sub(va1)).normalize();
                            this.faces.push(new THREE.Face3(a, b, n + a, [normal, normal, normal]));
                            this.faceVertexUvs[0].push([uvs[a], uvs[b], uvs[a]]); // shitty uvs to make 3js exporter happy
                            if (innerRadius > 0) {
                                this.faces.push(new THREE.Face3(b, n + b, n + a, [normal, normal, normal]));
                                this.faceVertexUvs[0].push([uvs[b], uvs[b], uvs[a]]); // shitty uvs to make 3js exporter happy
                            }
                        } else {
                            // hole
                            normal = va2.clone().sub(va1).cross(vb1.clone().sub(va1)).normalize();
                            this.faces.push(new THREE.Face3(b, a, n + a, [normal, normal, normal]));
                            this.faceVertexUvs[0].push([uvs[b], uvs[a], uvs[a]]); // shitty uvs to make 3js exporter happy
                            if (innerRadius > 0) {
                                this.faces.push(new THREE.Face3(b, n + a, n + b, [normal, normal, normal]));
                                this.faceVertexUvs[0].push([uvs[b], uvs[a], uvs[b]]); // shitty uvs to make 3js exporter happy
                            }
                        }
                    }
                }
            }
        }

        this.computeFaceNormals();

        this.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1);
    }
    if (window.THREE) {
        Map3DGeometry.prototype = Object.create(THREE.Geometry.prototype);
    }

    var selectCountryMix = (function () {
        var worldUrl = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : './world-50m.json';

        var _ = {};

        function init() {
            var g = this.register(earthjs.plugins.inertiaPlugin()).register(earthjs.plugins.hoverCanvas()).register(earthjs.plugins.centerCanvas()).register(earthjs.plugins.canvasPlugin()).register(earthjs.plugins.worldCanvas(worldUrl)).register(earthjs.plugins.threejsPlugin()).register(earthjs.plugins.autorotatePlugin());
            g.canvasPlugin.selectAll('.ej-canvas');

            g.worldCanvas.style({ countries: 'rgba(220,91,52,0.2)' });
            g.worldCanvas.ready = function (err, json) {
                g.worldCanvas.data(json);
            };
        }

        return {
            name: 'selectCountryMix',
            onInit: function onInit(me) {
                _.me = me;
                init.call(this);
            },
            region: function region(arr, centeroid) {
                var g = this;
                var reg = g.worldCanvas.countries().filter(function (x) {
                    return arr.indexOf(x.id) > -1;
                });
                g.worldCanvas.selectedCountries(reg);
            },
            multiRegion: function multiRegion(mregion, centeroid) {
                var reg = [];
                var g = this;
                var _iteratorNormalCompletion = true;
                var _didIteratorError = false;
                var _iteratorError = undefined;

                try {
                    var _loop = function _loop() {
                        var obj = _step.value;

                        var arr = g.worldCanvas.countries().filter(function (x) {
                            var bool = obj.countries.indexOf(x.id) > -1;
                            if (bool) {
                                x.color = obj.color;
                                x.borderColor = obj.borderColor;
                                x.borderWidth = obj.borderWidth;
                            }
                            return bool;
                        });
                        reg = reg.concat(arr);
                    };

                    for (var _iterator = mregion[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                        _loop();
                    }
                } catch (err) {
                    _didIteratorError = true;
                    _iteratorError = err;
                } finally {
                    try {
                        if (!_iteratorNormalCompletion && _iterator.return) {
                            _iterator.return();
                        }
                    } finally {
                        if (_didIteratorError) {
                            throw _iteratorError;
                        }
                    }
                }

                g.worldCanvas.selectedCountries(reg, true);
                g.autorotatePlugin.stop();
                if (centeroid) {
                    g.centerCanvas.go(centeroid);
                }

            }
        };
    });

    earthjs$2.plugins = {
        worldJson: worldJson,
        hoverCanvas: hoverCanvas,
        canvasPlugin: canvasPlugin,
        inertiaPlugin: inertiaPlugin,
        threejsPlugin: threejsPlugin,
        autorotatePlugin: autorotatePlugin,
        worldCanvas: worldCanvas,
        centerCanvas: centerCanvas,
        imageThreejs: imageThreejs,
        selectCountryMix: selectCountryMix
    };

    return earthjs$2;

}());

export default earthjs;