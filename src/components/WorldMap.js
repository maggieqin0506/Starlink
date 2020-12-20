import React, {Component} from "react";
import axios from "axios";
import {Spin} from "antd";
import {feature} from "topojson-client";
import {geoKavrayskiy7} from "d3-geo-projection";
import {geoGraticule, geoPath} from "d3-geo";
import {select as d3Select} from "d3-selection";
import {schemeCategory10} from "d3-scale-chromatic";
import * as d3Scale from "d3-scale";
import {timeFormat as d3TimeFormat} from "d3-time-format";

import {
    WORLD_MAP_URL,
    SATELLITE_POSITION_URL,
    SAT_API_KEY
} from "../constants";

const width = 960;
const height = 600;

class WorldMap extends Component {
    constructor() {
        super();
        this.state = {
            map: null
        }
        // create a ref so that you could get the map
        this.refMap = React.createRef();
        this.map = null;
        // d3Scale map between index(numbers) and colors
        this.color = d3Scale.scaleOrdinal(schemeCategory10);
        this.refTrack = React.createRef();
    }

    // get data from the backend
    componentDidMount() {
        //.then()  - succeed
        // .catch() - failure
        axios.get(WORLD_MAP_URL)
            .then(res => {
                const {data} = res;
                const land = feature(data, data.objects.countries).features;
                this.generateMap(land);
            })
            .catch(e => console.log('err in fecth world map data ', e))
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if (prevProps.satData !== this.props.satData) {
            // get the satellite data
            const {
                latitude,
                longitude,
                elevation,
                altitude,
                duration
            } = this.props.observerData;

            // speed up by 60 times
            const endTime = duration * 60;

            this.setState({
                isLoading: true
            });

            // step 1: prepare url
            // data: satellite data
            const urls = this.props.satData.map(sat => {
                const {satid} = sat;
                const url = `/api/${SATELLITE_POSITION_URL}/${satid}/${latitude}/
                ${longitude}/${elevation}/${endTime}/&apiKey=${SAT_API_KEY}`;

                // send ajax call
                return axios.get(url);
            });

            // step 2: parse satellite positions
            // axios.all() - get result
            axios
                .all(urls)
                .then(
                    // spread() - follow an call back, get the result of response
                    // collect data ... args
                    // return an array - filter
                    // equivalent to promise.all
                    axios.spread((...args) => {
                        return args.map(item => item.data); // only keep item.data; filter
                    })
                )
                .then(res => {
                    this.setState({
                        isLoading: false,
                        isDrawing: true
                    });

                    if (!prevState.isDrawing) {
                        this.track(res);
                    } else {
                        const oHint = document.getElementsByClassName("hint")[0];
                        oHint.innerHTML =
                            "Please wait for these satellite animation to finish before selection new ones!";
                    }
                })
                .catch(e => {
                    console.log("err in fetch satellite position -> ", e.message);
                });
        }
    }

    track = data => {
        if (!data[0].hasOwnProperty("positions")) {
            throw new Error("no position data");
            return;
        }

        const len = data[0].positions.length;
        const {duration} = this.props.observerData;
        const {context2} = this.map;

        let now = new Date();

        let i = 0;

        // 每隔多久画一次
        let timer = setInterval(() => {
            // 画图的逻辑结构
            let ct = new Date();

            // check if is the initial state
            // if not, check how many time has passed
            let timePassed = i === 0 ? 0 : ct - now;

            // 加速60倍的数据
            let time = new Date(now.getTime() + 60 * timePassed);

            context2.clearRect(0, 0, width, height);

            context2.font = "bold 14px sans-serif";
            context2.fillStyle = "#333";
            context2.textAlign = "center";
            // show the time
            context2.fillText(d3TimeFormat(time), width / 2, 10);

            if (i >= len) {
                // if don't clear then 越界了，arent able to get data
                clearInterval(timer);
                this.setState({isDrawing: false});
                const oHint = document.getElementsByClassName("hint")[0];
                oHint.innerHTML = "";
                return;
            }

            // draw
            data.forEach(sat => {
                const {info, positions} = sat;
                this.drawSat(info, positions[i]);
            });

            // process the changing i
            i += 60;
        }, 1000);
    };

    drawSat = (sat, pos) => {
        const {satlongitude, satlatitude} = pos;

        if (!satlongitude || !satlatitude) return;

        const {satname} = sat;
        // regular expression: 找一个或多个数字，extract all numbers and then join
        const nameWithNumber = satname.match(/\d+/g).join("");

        const {projection, context2} = this.map;
        const xy = projection([satlongitude, satlatitude]);

        context2.fillStyle = this.color(nameWithNumber);
        context2.beginPath();
        // draw a circle
        context2.arc(xy[0], xy[1], 4, 0, 2 * Math.PI);
        context2.fill();

        context2.font = "bold 11px sans-serif";
        context2.textAlign = "center";
        // name of the satellite and position,
        // name of the satellite and position,
        context2.fillText(nameWithNumber, xy[0], xy[1] + 14);
    };

    generateMap(land) {
        // create an projection map and set the parameters
        const projection = geoKavrayskiy7()
            .scale(170)
            .translate([width / 2, height / 2])
            .precision(.1);

        // this library provides latitude and longitude data
        const graticule = geoGraticule();

        // get the 画图位置
        const canvas = d3Select(this.refMap.current)
            .attr("width", width)
            .attr("height", height);

        const canvas2 = d3Select(this.refTrack.current)
            .attr("width", width)
            .attr("height", height);

        // 画布
        const context = canvas.node().getContext("2d");
        const context2 = canvas2.node().getContext("2d");


        // 真实数据和path进行投影
        let path = geoPath()
            .projection(projection)
            .context(context);

        // ele - each data
        land.forEach(ele => {
            // draw one path
            context.fillStyle = '#B3DDEF';
            context.strokeStyle = '#000';
            context.globalAlpha = 0.7;
            context.beginPath();
            path(ele);
            context.fill();
            context.stroke();

            // draw the longitude and altitude
            context.strokeStyle = 'rgba(220, 220, 220, 0.1)';
            context.beginPath();
            path(graticule());
            context.lineWidth = 0.1;
            context.stroke();

            context.beginPath();
            context.lineWidth = 0.5;
            path(graticule.outline());
            context.stroke();
        })
        // give canvas to the map
        // change it to the class attributes
        this.map = {
            projection: projection,
            graticule: graticule,
            context: context,
            context2: context2
        };
    }

    render() {
        const {isLoading} = this.state;
        return (
            <div className="map-box">
                {isLoading ? (
                    <div className="spinner">
                        <Spin tip="Loading..." size="large"/>
                    </div>
                ) : null}
                <canvas className="map" ref={this.refMap}/>
                <canvas className="track" ref={this.refTrack}/>
                <div className="hint"/>
            </div>
        );
    }
}

export default WorldMap;
