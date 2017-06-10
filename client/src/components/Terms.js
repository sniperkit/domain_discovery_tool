// Filename:		Terms.js
// Purpose:		This is an intermediate component between Body.js and TermsList.js. It handles the changes in Terms card.
// Author: Sonia Castelo (scastelo2@gmail.com)
import React, {Component} from 'react';
import {Card, CardHeader, CardMedia} from 'material-ui/Card';
import TermsList from './TermsList';
import Avatar from 'material-ui/Avatar';
import Assignment from 'material-ui/svg-icons/action/assignment-returned';
import Divider from 'material-ui/Divider';
import $ from 'jquery';
import CircularProgress from 'material-ui/CircularProgress';

const styles = {
  card: {

    borderStyle: 'solid',
    borderColor: '#C09ED7',
    background: 'white',
    borderRadius: '0px 0px 0px 0px',
    borderWidth: '0px 0px 1px 0px'
  },
  avatar:{
    margin:'-4px 8px 0px 0px',
  },
  cardHeader:{
    background: '#DCCCE7',
    padding:'10px 1px 10px 6px',
    borderRadius: '0px 0px 0px 0px',
  },
  cardMedia:{
    background: '#DCCCE7',
    padding:'2px 4px 2px 4px',
    borderRadius: '0px 0px 0px 0px',
    height: "390px",
  },

};

class CircularProgressSimple extends React.Component{
  render(){
    return(
    <div style={{borderColor:"green", marginLeft:"50%"}}>
      <CircularProgress size={30} thickness={7} />
    </div>
  );}
}


class Terms extends Component{

  constructor(props) {
    super(props);
    this.state = {
      expanded: this.props.statedCard,
      update:true,
      listTerms: [],
    };
  };

  componentWillMount = () => {
   this.setState({expanded: this.props.statedCard, });
     this.loadTerms(this.props.session);
  };

  //Handling state's changes of search card. (expanded or reduced)
  componentWillReceiveProps  = (newProps) => {
        if(this.props.statedCard){
          this.loadTerms(this.props.session);
        }
       this.setState({expanded: this.props.statedCard}, function() {
            this.setState({expanded: this.props.statedCard});
       });

   };

  handleExpandChange = (expanded) => {
    this.setState({expanded: expanded});
    if(expanded){
      this.props.setActiveMenu(expanded, 3);

    }
  };

  handleReduce = () => {
    this.setState({expanded: false});
  };


    loadTerms(session){
      console.log("session");
      console.log(session);
      $.post(
        '/extractTerms',
  	{'numberOfTerms': 40, 'session': JSON.stringify(session)},
          function(summary) {
              console.log(summary);
              var entries = [];
              entries = summary.map(function(w) {
                                      return {'word': w[0], 'posFreq': w[1], 'negFreq': w[2], 'tags': w[3]}
                                    });
              this.setState({listTerms: entries});
        }.bind(this)).fail(function() {
              console.log("Something wrong happen. Try again.");
        }.bind(this));
    };


  //Check if the component should be updated or not
  shouldComponentUpdate(){
    return true;

  }


  render(){
    console.log(this.state.listTerms.length);
    let terms = " ";
    if(this.state.listTerms.length>0){
      terms = this.state.listTerms.map(function(w) {
        return <p>{w["word"]}</p>;
      });
    }
    var isThereTerms = (this.state.listTerms.length>0)?<TermsList listTerms={this.state.listTerms}  session={this.props.session}></TermsList>:<CircularProgressSimple />;
    return(

      <Card expanded={this.state.expanded} onExpandChange={this.handleExpandChange} style={styles.card}>
      <CardHeader
      title="Terms"
      avatar={ <Avatar color={'white'} backgroundColor={'#7940A0'} size={this.state.sizeAvatar} style={styles.avatar} icon={<Assignment />} />}
      style={styles.cardHeader}
      actAsExpander={true}
      showExpandableButton={true}
      />
      <CardMedia expandable={true} style={styles.cardMedia}>
      <Divider/>
      <div>
      {isThereTerms}
      </div>
      </CardMedia>
      </Card>
    )
  }

}

export default Terms;
