import React, {Component} from 'react';
import {List, Avatar, Button, Checkbox, Spin} from 'antd';
import satellite from "../assets/images/satellite.svg";

class SatelliteList extends Component {
    constructor() {
        super();
        this.state = {
            selected: [],
            isLoad: false
        };
    }

    onChange = e => {
        // step 1: get current selected satellite info
        // 解构， data info , current state(选中还是删除)
        const {dataInfo, checked} = e.target;
        const {selected} = this.state;
        // step 2: add or remove current selected sarellite to the array
        const list = this.addOrRemove(dataInfo, checked, selected);
        // step 3: update the selected state since we need to pass the data to the main
        this.setState({selected: list})
    }


    addOrRemove = (item, status, list) => {
        const found = list.some(entry => entry.satid === item.satid);
        // case 1: check is true
        //      -> item not in the list => ADD THE ITEM
        //      -> item in the list => DO NOTHING
        if (status && !found) {
            list.push(item)
        }

        // case 2: check is false
        //      -> item in the list => REMOVE THE ITEM
        //      -> item not in the list => DO NOTHING
        if (!status && found) {
            list = list.filter(entry => {
                return entry.satid !== item.satid;
            });
        }
        return list;
    }
    onShowSatMap = () => {
        this.props.onShowMap(this.state.selected);
    }

    render() {
        // check if the list is empty or not
        const satList = this.props.satInfo ? this.props.satInfo.above : [];
        const {isLoad} = this.props;
        const {selected} = this.state;

        return (
            <div className="sat-list-box">
                <Button className="sat-list-btn"
                        size="large"
                        disabled={selected.length === 0}
                        onClick={this.onShowSatMap}
                >Track on the map</Button>
                <hr/>

                {
                    isLoad ? // spin the box when we are fetching the data
                        <div className="spin-box">
                            <Spin tip="Loading..." size="large"/>
                        </div>
                        :
                        <List
                            className="sat-list"
                            itemLayout="horizontal"
                            size="small"
                            dataSource={satList} // our own data source
                            renderItem={item => ( // call back function
                                // list's each option
                                <List.Item
                                    // 对于item的操作
                                    actions={[<Checkbox dataInfo={item} onChange={this.onChange}/>]}
                                >

                                    <List.Item.Meta // use the  satellite.svg logo
                                        avatar={<Avatar size={50} src={satellite}/>}
                                        title={<p>{item.satname}</p>}
                                        description={`Launch Date: ${item.launchDate}`}
                                    />

                                </List.Item>
                            )}
                        />
                }
            </div>
        );
    }
}

export default SatelliteList;
