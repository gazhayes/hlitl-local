import React, { useEffect, useState } from 'react'
import MainLayout from './MainLayout'
import { withTracker } from 'meteor/react-meteor-data';
import { Locations, LocationsIndex } from '../api/lines.js';
import { Meteor } from 'meteor/meteor';
import { Icon, Button, ListItem, ListTitle, Card, ProgressCircular, SearchInput, ProgressBar } from 'react-onsenui'
import moment from 'moment';
import { Tracker } from 'meteor/tracker'
import { toast } from 'react-toastify';
import { useCookies } from 'react-cookie';
import { bgcolor } from '@material-ui/system';

function Index({ history }) {
    const [loc, setLoc] = useCookies(['location']);
    const [nearby, setNearby] = useState();
    const [AllLocations, setAllLocations] = useState([])
    const [search, setSearch] = useState("");


    function isOpening(location){
        if(!location.opening || !location.closing){
            return true
        }
        var d = new Date();
        var now;
        var open;
        var close;
        if(d.getUTCMinutes() < 10){
            now = d.getUTCHours() + ".0" + d.getUTCMinutes();
        }
        else{
            now = d.getUTCHours() + "." + d.getUTCMinutes();
        }
        if(location.opening[1] < 10){
            open = location.opening[0]+".0"+location.opening[1]
        }else
        {
            open = location.opening[0]+"."+location.opening[1]
        }
        if(location.closing[1]< 10){
            close = location.closing[0]+".0"+location.closing[1]
        }else{
            close = location.closing[0]+"."+location.closing[1]
        }

        if(close > open){
            if(now > open && now < close)
            {
                return true
            }
            else
            {
                return false
            }
        }
        else{
            if(close > now || (now > open && 24 > now)){
                return true
            }else{
                return false
            }
        }
    }

    function compare(a, b) {
        if (distance(a.coordinates[1], a.coordinates[0], loc.location.latitude, loc.location.longitude, "K") < distance(b.coordinates[1], b.coordinates[0], loc.location.latitude, loc.location.longitude, "K"))
            return -1;
        if (distance(a.coordinates[1], a.coordinates[0], loc.location.latitude, loc.location.longitude, "K") > distance(b.coordinates[1], b.coordinates[0], loc.location.latitude, loc.location.longitude, "K"))
            return 1;
        return 0;
    }

    function distance(lat1, lon1, lat2, lon2, unit) {
        if ((lat1 == lat2) && (lon1 == lon2)) {
            return 0;
        }
        else {
            var radlat1 = Math.PI * lat1 / 180;
            var radlat2 = Math.PI * lat2 / 180;
            var theta = lon1 - lon2;
            var radtheta = Math.PI * theta / 180;
            var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
            if (dist > 1) {
                dist = 1;
            }
            dist = Math.acos(dist);
            dist = dist * 180 / Math.PI;
            dist = dist * 60 * 1.1515;
            if (unit == "K") { dist = dist * 1.609344 }
            if (unit == "N") { dist = dist * 0.8684 }
            return dist;
        }
    }

    useEffect(() => {
        if (loc.location != undefined) {
            if ((new Date().getTime() - new Date(loc.location.time).getTime()) / 1000 < 300) {
                // getNearby(loc.location.longitude, loc.location.latitude)
            }
            else {
                getLocation()
            }
        }
        else {
            getLocation()
        }
        return () => {
        }
    }, [])

    function getLocation() {
        navigator.geolocation.getCurrentPosition((position) => {
            setLoc('location', { longitude: position.coords.longitude, latitude: position.coords.latitude, time: new Date() }, { path: '/' });
            getNearby(position.coords.longitude, position.coords.latitude)
        }, (err) => {
            toast("Cant get current location, please turn on browser's geolocation function and refresh, or try a different browser")
            console.warn(`ERROR(${err.code}): ${err.message}`);
        });
    }


    function getNearby(long, lat) {
        Meteor.call('locations.findnearby', long, lat, (err, result) => {
            setNearby(result)
        })
    }


    useEffect(() => {
        let isCancelled = false;
        try {
            if (!isCancelled) {
                Tracker.autorun(function () {
                    if (!isCancelled) {
                        if (search == "") {
                            setAllLocations(Locations.find({}, { sort: { lastUpdate: -1 }, limit: 100 }).fetch())
                        }
                        else {
                            let cursor = LocationsIndex.search(search)
                            setAllLocations(cursor.fetch())
                        }
                    }
                })
            }
        } catch (e) {
            if (!isCancelled) {
                throw e;
            }
        }
        return function cleanup() {
            isCancelled = true;
        }
    }, [search])

    function renderCard(location) {
        return (
            <Card key={location._id} style={{backgroundColor: isOpening(location)? "" : "grey"}}>
                <ListItem modifier="nodivider">
                    {location.name}
                    <div className="right">
                        Updated: {moment(location.lastUpdate).fromNow()}

                    </div>
                </ListItem>
                <ListItem modifier="nodivider">
                    {location.address}
                    {/*<div className="right">
                         }<Button
                        onClick={() => {
                            history.push('/shopDetails?id=' + location._id)
                        }}
                    >More Details</Button>
                    </div> */}
                </ListItem>
                <ListItem modifier="nodivider">
                    <div className="center">Status:&nbsp;{statusToWord(location.status)}</div>
                    <div className="right">
                        {isOpening(location) ? "": "Closed"}
                    </div>
                </ListItem>
                <ListItem modifier="nodivider">
                    <div className="center">
                        <Button
                            onClick={() => {
                                history.push('/editLine?id=' + location._id)
                            }}
                        >Change line status now</Button>
                    </div>
                </ListItem>
                {/*
                    <div className="right">
                        {location.upvote}
                        <Button modifier="quiet"
                            onClick={(e) => {
                                e.preventDefault()
                                Meteor.call("locations.upvote", location._id, (err, result)=>{
                                    if(err){
                                    toast(err)
                                    }
                                    if(result=="wait"){
                                        toast("please wait 1 min to upvote")
                                    }
                                })
                                getNearby(currentLocation)
                            }}>

                            <Icon
                                size={15}
                                icon="fa-thumbs-up"
                            />
                        </Button>
                    </div>
                    */}
            </Card>
        )
    }

    function statusToWord(statusCode) {
        switch (statusCode) {
            case "no":
                return <div style={{ color: "green" }}>No Lines!</div>
            case "small":
                return <div style={{ color: "orange" }}>A Wee Wait</div>
            case "long":
                return <div style={{ color: "red" }}>Busy. Stay Home.</div>
        }
    }

    function renderList() {
        if (loc.location != undefined) {
            var sorted = AllLocations.sort(compare)
            return sorted.map((location) => {
                return renderCard(location)
            })
        }
        return AllLocations.map((location) => {
            return renderCard(location)
        })
    }

    function renderNearby() {
        if (!nearby) {
            return (
                <Card>
                    <div><ProgressCircular indeterminate />Please wait, finding your current location...</div>
                </Card>
            )
        }
        return nearby.map((location) => {
            return renderCard(location)
        })
    }

    function renderLoading() {
        if (loc.location == undefined) {
            return (<Card>
                <ProgressBar indeterminate />
                getting you location
            </Card>
            )
        }
        else {
            return
        }
    }


    if (search != "") {
        return (
            <MainLayout>
                <div style={{ position: "sticky", top: 0 }}>
                    <ListItem>
                        <SearchInput style={{ width: "80%" }} placeholder="Start typing here to find a store" onChange={(e) => {
                            setSearch(e.target.value)
                        }} />
                    </ListItem>
                </div>
                <div style={{ marginBottom: 55 }}>
                    <ListTitle>
                        Results
                </ListTitle>
                    {renderList()}
                </div>
                <Button modifier="large--cta" style={{ position: "fixed", bottom: 0, zIndex: 1000, minHeight: 50 }}
                    // type="submit"
                    onClick={() => { history.push('/addLine') }}>
                    Missing shop? Add it now!
                        <Icon style={{ marginLeft: 10 }} icon='fa-plus' />
                </Button>
            </MainLayout>
        )
    }


    return (
        <MainLayout>
            <div style={{ position: "sticky", top: 0 }}>
                <ListItem>
                    <SearchInput style={{ width: "80%" }} placeholder="search" onChange={(e) => {
                        setSearch(e.target.value)
                    }} />
                </ListItem>
            </div>
            <div style={{ marginBottom: 55 }}>
                {renderLoading()}
                <ListTitle>
                    All Shops
            </ListTitle>
                {renderList()}
            </div>
            <Button modifier="large--cta" style={{ position: "fixed", bottom: 0, zIndex: 1000, minHeight: 50 }}
                // type="submit"
                onClick={() => { history.push('/addLine') }}>
                Missing shop? Add it now!
                    <Icon style={{ marginLeft: 10 }} icon='fa-plus' />
            </Button>
        </MainLayout>
    )
}


export default withTracker(() => {
    Meteor.subscribe('locations');

    return {
        // AllLocations: Locations.find({}, { sort: { lastUpdate: -1 } }).fetch(),
        //   currentUser: Meteor.user,
    };
})(Index);
