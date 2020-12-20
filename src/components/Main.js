import React, {Component} from 'react';
import axios from 'axios';
import SatSetting from './SatSetting';
import SatelliteList from './SatelliteList';
import WorldMap from './WorldMap'
import {NEARBY_SATELLITE, SAT_API_KEY, STARLINK_CATEGORY} from "../constants";

class Main extends Component {
    constructor() {
        super();
        this.state = {
            satInfo: null,
            settings: null,
            satList: null,
            // waiting for the data icon; false - not spinning
            isLoadingList: false
        };
    }

    showMap = (selected) => {
        this.setState(preState => ({
            ...preState,
            satList: [...selected]
        }))
    }


    // transfer the data (setting)
    // set once, rerender once
    showNearbySatellite = (setting) => {
        this.setState({
            isLoadingList: true,
            setting: setting
        })
        this.fetchSatellite(setting);
    }

    // fetch data
    fetchSatellite = (setting) => {
        // fetch data from N2Y0
        // step 1: get setting values
        const {latitude, longitude, elevation, altitude} = setting;

        // step 2: prepare url
        // base url + /api/ + ...
        // 不能直接用domain因为会出现跨域访问的问题
        // 我们要用/api/ 作为代理 它会指向domain
        const url = `/api/${NEARBY_SATELLITE}/${latitude}/${longitude}/${elevation}/${altitude}/
        ${STARLINK_CATEGORY}/&apiKey=${SAT_API_KEY}`;

        this.setState({
            isLoadingList: true
        });

        // step 3: ajax call by using axios
        //
        // axois.get(url).then( get the response)
        // promise 用法
        // get() - return promise
        // .then() - get data
        // .catch() - receive errors
        axios.get(url)
            .then(response => {
                console.log(response.data)
                this.setState({
                    satInfo: response.data,
                    isLoadingList: false
                })
            })
            .catch(error => {
                console.log('error in fetch satellite -> ', error);
            })
    }


    render() {
        const { isLoadingList, satInfo, satList, setting } = this.state;
        return (
            <div className="main">
                <div className="left-side">
                    <SatSetting onShow={this.showNearbySatellite}/>
                    <SatelliteList isLoad={isLoadingList}
                                   satInfo={satInfo}
                                   onShowMap={this.showMap} />
                </div>
                <div className="right-side">
                    <WorldMap satData={satList} observerData={setting} />
                </div>
            </div>
        );
    }


}

export default Main;
