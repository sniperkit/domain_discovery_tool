import React, { Component } from 'react';
import { Col, Row} from 'react-bootstrap';
// From https://github.com/oliviertassinari/react-swipeable-views
import Terms from './Terms';
import {Tabs, Tab} from 'material-ui/Tabs';
import SwipeableViews from 'react-swipeable-views';
import { InputGroup, FormControl , DropdownButton,  MenuItem} from 'react-bootstrap';
import FlatButton from 'material-ui/FlatButton';
import {fullWhite} from 'material-ui/styles/colors';
import Search from 'material-ui/svg-icons/action/search';
import TextField from 'material-ui/TextField';
import Dialog from 'material-ui/Dialog';
import {Toolbar, ToolbarSeparator, ToolbarTitle} from 'material-ui/Toolbar';
import Paper from 'material-ui/Paper';
import RaisedButton from 'material-ui/RaisedButton';
import IconMenu from 'material-ui/IconMenu';
import RemoveURL from 'material-ui/svg-icons/navigation/cancel';
import IconButton from 'material-ui/IconButton';
import {Card, CardActions, CardHeader, CardText} from 'material-ui/Card';
import Checkbox from 'material-ui/Checkbox';
import Divider from 'material-ui/Divider';
import {
  Table,
  TableBody,
  TableFooter,
  TableHeader,
  TableHeaderColumn,
  TableRow,
  TableRowColumn,
} from 'material-ui/Table';
import $ from 'jquery';

import MultiselectTable from './MultiselectTable';

const styles = {
  headline: {
    fontSize: 24,
    paddingTop: 16,
    marginBottom: 12,
    fontWeight: 400,
  },
  slide: {
    padding: 10,
  },
  content: {
    marginTop: '5px',
    marginRight: '5px',
    marginBottom: '8px',
    marginLeft: '5px',
    backgroundColor: '#FFFFFF',
    borderRadius: '10px 10px 10px 10px',
  },
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
    background: "white", //'#DCCCE7',
    padding:'10px 1px 10px 6px',
    borderRadius: '0px 0px 0px 0px',
  },
  cardMedia:{
    background: "white",
    padding:'2px 4px 2px 4px',
    borderRadius: '0px 0px 0px 0px',
    height: "390px",
  },
};


class CrawlingView extends Component {

  constructor(props) {
    super(props);
    this.state = {
      slideIndex: 0,
      recommendations: this.getRecommendationResults(),
      pages:{},
      openDialogLoadUrl: false,
      currentTags:undefined,
      tagsPosCheckBox:["Relevant"],
      tagsNegCheckBox:["Irrelevant"],
      deepCrawlableDomains: [],
      resetSelection: false,
      openLoadURLs: false,
      session:"",
    };
    this.selectedRows = [];
    this.addDomainsForDeepCrawl = this.addDomainsForDeepCrawl.bind(this);
    this.addDomainsOnSelection = this.addDomainsOnSelection.bind(this);
  }

  /**
  * Get the current tlds in deep crawler tag.
  * @method getCurrentTLDSfromDeepCrawlTag
  * @param
  */
  getCurrentUrlsfromDeepCrawlTag(pages){
    var urlsList = {};
    var urlsList2 =  (Object.keys(pages).length>0)? Object.keys(pages)
                        .map((k, index)=>{ urlsList[k]="1"; }) : {};
    return Object.keys(urlsList)
              .map(reco => [reco, urlsList[reco]])
              .sort((a, b) => ((a[1] > b[1]) ? -1 : ((a[1] < b[1]) ? 1 : 0)));
  }

  /**
  * Creating session to get the urls with deep crawl tag.
  * @method createSession
  * @param {string} domainId
  */
  /*consultaQueries: {"search_engine":"GOOG","activeProjectionAlg":"Group by Correlation"
  ,"domainId":"AVWjx7ciIf40cqEj1ACn","pagesCap":"100","fromDate":null,"toDate":null,
  "filter":null,"pageRetrievalCriteria":"Most Recent","selected_morelike":"",
  "model":{"positive":"Relevant","nagative":"Irrelevant"}}*/
  createSession(domainId){
    var session = {};
    session['search_engine'] = "GOOG";
    session['activeProjectionAlg'] = "Group by Correlation";
    session['domainId'] = domainId;
    session['pagesCap'] = "100";
    session['fromDate'] = null;
    session['toDate'] = null;
    session['filter'] = null; //null
    session['newPageRetrievalCriteria'] = "one";
    session['pageRetrievalCriteria'] = "Tags";
    session['selected_morelike'] = "";
    session['selected_queries']="";
    session['selected_tlds']="";
    session['selected_aterms']="";
    session['selected_tags']="Deep Crawl";
    session['selected_model_tags']="";
    session['selected_crawled_tags']="";
    session['model'] = {};
    session['model']['positive'] = "Relevant";
    session['model']['nagative'] = "Irrelevant";
    session["from"]=0;
    return session;
  }

  //Returns dictionary from server in the format: {url1: {snippet, image_url, title, tags, retrieved}} (tags are a list, potentially empty)
  getPages(session){
    $.post(
      '/getPages',
      {'session': JSON.stringify(session)},
      function(pages) {
        var urlsfromDeepCrawlTag = this.getCurrentUrlsfromDeepCrawlTag(pages["data"]["results"]);
        this.setState({deepCrawlableDomainsFromTag: urlsfromDeepCrawlTag, session:session, pages:pages["data"]["results"], sessionString: JSON.stringify(session), lengthPages : Object.keys(pages['data']["results"]).length,  lengthTotalPages:pages['data']['total'], });
        this.forceUpdate();
      }.bind(this)
    );
  }

  /**
  * Set the deepCrawlableDomainsFromTag state for displaying the current tlds in deep crawler tag.
  * @method componentWillMount
  * @param
  */
  componentWillMount(){
    var session = this.createSession(this.props.domainId);
    this.getPages(session);
    this.getAvailableTags(session);
  }
  getAvailableTags(session){
     $.post(
        '/getAvailableTags',
        {'session': JSON.stringify(session), 'event': 'Tags'},
        function(tagsDomain) {
          this.setState({currentTags: tagsDomain['tags']}); //, session:this.props.session, tagString: JSON.stringify(this.props.session['selected_tags'])});
          this.forceUpdate();
        }.bind(this)
      );
   }
  handleChange = (value) => {
    this.setState({
      slideIndex: value,
      valueLoadUrls:[],
      valueLoadUrlsFromTextField:[],
    });
  };

  getRecommendationResults() {
    var recommendations = {
      'pajiba.com': 1,
      'pamageller.com': 6,
      'pandemic.internationalsos.com': 1,
      'papmiket.com': 1,
      'paper.wenweipo.com': 1,
      'papers.ssrn.com': 1,
      'parabarbarian.blogspot.com': 25,
      'parade.com': 15,
      'paraitesinblackandwhite.blogspot.com': 6,
      'parusfamilia.com': 10,
      'papers.ssrn.com': 1,
      'parabarbarian.blogspot.com': 25,
      'parade.com': 15,
      'parasitesinblackandwhite.blogspot.com': 6,
      'paratusfamilia.com': 10,
      'papers.ssrn.com': 1,
      'parabarbarian.blogspot.com': 25,
      'parade.com': 15,
      'parasitesinblackandwhite.com': 6,
      'paratufia.com': 10,
      'papes.ssrn.com': 1,
      'parabarbarian.blogspot.com': 25,
      'parade.com': 15,
      'parasitenblackandwhite.blogspot.com': 6,
      'paratusamilia.com': 10,
      'paratufia.': 10,
      'papes.ssrcom': 1,
      'parabarbariancom': 25,
      'com': 15,
      '.blogspot.com': 6,
      '.com': 10
    };

    return Object.keys(recommendations)
            .map(reco => [reco, recommendations[reco]])
            .sort((a, b) => ((a[1] > b[1]) ? -1 : ((a[1] < b[1]) ? 1 : 0)));
  }

  /**
  * Set the state for displaying the selected list of deep crawlable urls
  * @method addDomainsOnSelection (onClick event)
  * @param {Object} event
  */
  addDomainsForDeepCrawl(event) {
    let deepCrawlableIndex = this.state.deepCrawlableDomains.map(domain => domain[2]);
    this.selectedRows.forEach((rowIndex) => {
      if(deepCrawlableIndex.indexOf(rowIndex) === -1) {
        let recommendation = this.state.recommendations.find((reco, index) => index === rowIndex);
        this.state.deepCrawlableDomains.push([recommendation[0], recommendation[1], rowIndex]);
      }
    })

    this.setState({
      deepCrawlableDomains: this.state.deepCrawlableDomains,
      resetSelection: true
    });
  }

  /**
  * Assigns the selected rows of the table to deepCrawlableDomains key in state
  * @method addDomainsOnSelection (onRowSelection event)
  * @param {number[]} selectedRows
  */
  addDomainsOnSelection(selectedRows) {
    this.selectedRows = selectedRows;
  }

  /**
  * Add domain from file or textField (or both) to deep crawl.
  * @method addDomainsFromFileForDeepCrawl
  * @param {}
  */
  addDomainsFromFileForDeepCrawl() {
    let aux_deepCrawlableDomains = this.state.deepCrawlableDomains;
    var aux_valueLoadUrls = (this.state.valueLoadUrls!==undefined)?this.state.valueLoadUrls:[];
    //Append urls from textField to this.state.valueLoadUrls
    var valueLoadUrlsFromTextField = (this.state.valueLoadUrlsFromTextField!==undefined)?((this.state.valueLoadUrlsFromTextField!=="")?this.state.valueLoadUrlsFromTextField.split(/\r\n|\n/):[]):[];

    valueLoadUrlsFromTextField.forEach((value) => {
      aux_valueLoadUrls.push(value);
    });
    //Append new urls to deepCrawlableDomains
    aux_valueLoadUrls.forEach((value) => {
      aux_deepCrawlableDomains.push([value, 1]);
    })
    this.setState({
      deepCrawlableDomains: aux_deepCrawlableDomains,
      resetSelection: true,
      valueLoadUrls:[],
      valueLoadUrlsFromTextField:"",
    });
  }

  // Download the pages of uploaded urls from file
  runLoadUrlsFileQuery(txt) {
    var allTextLines = txt.split(/\r\n|\n/);
    this.setState({ valueLoadUrls: allTextLines, });//allTextLines.join(" ")});
  }
  //Reading file's content.
  handleFile(event) {
    const reader = new FileReader();
    const file = event.target.files[0];
    reader.onload = (upload) => {
      this.runLoadUrlsFileQuery(upload.target.result);
    };
    reader.readAsText(file);
  }

  //Handling open/close 'load url' Dialog
  handleOpenDialogLoadUrl = () => {
    this.setState({openDialogLoadUrl: true});
    //this.focusTextField();
  };
  handleCloseDialogLoadUrl  = () => {
    this.setState({openDialogLoadUrl: false, newNameTerm:"",});
    this.termsFromFile=[]; // Empting the terms from file.
  };

  //Handling value into 'load urls' textfield
  handleTextChangeLoadUrls(e){
    this.setState({ valueLoadUrlsFromTextField: e.target.value});
  }

  //Adding urls from file and the textField.
  addURLfromFileAndTextField(){
    this.addDomainsFromFileForDeepCrawl();
    this.handleCloseDialogLoadUrl();

  }

  //Removing selected url from the table to deepCrawlableDomains
  handleRemodeUrlFromList(url, index){
    //var total_deepCrawlableDomains = this.state.deepCrawlableDomainsFromTag.length;
    var urlsList = this.state.deepCrawlableDomains;
    var deepCrawlableDomains_aux =  urlsList.splice(index,1);
    this.setState({deepCrawlableDomains:urlsList});
    this.forceUpdate();
  }



  addPosTags(tag){
        var tags = this.state.tagsPosCheckBox;
        if(tags.includes(tag)){
          var index = tags.indexOf(tag);
          tags.splice(index, 1);
        }
        else{
          tags.push(tag);
        }
        this.setState({tagsPosCheckBox:tags})
        this.forceUpdate();
     }

     addNegTags(tag){
        var tags = this.state.tagsNegCheckBox;
        if(tags.includes(tag)){
          var index = tags.indexOf(tag);
          tags.splice(index, 1);
        }
        else{
          tags.push(tag);
        }
        this.setState({tagsNegCheckBox:tags})
        this.forceUpdate();
     }


   handleCloseCancelCreateModel = () => {
     this.setState({  tagsPosCheckBox:["Relevant"], tagsNegCheckBox:["Irrelevant"],})
     this.forceUpdate();
   };

  render() {

    const actionsLoadUrls = [
                        <FlatButton label="Cancel" primary={true} onTouchTap={this.handleCloseDialogLoadUrl.bind(this)}/>,
                        <FlatButton label="Add" style={{marginLeft:10}} primary={true} keyboardFocused={true} onTouchTap={this.addURLfromFileAndTextField.bind(this)}/>,
                            ];
    const heightTableStyle = { height: "10px", padding: "0px"};

    var checkedTagsPosNeg = (this.state.currentTags!==undefined) ?
                          <div>
                          Positive
                          {Object.keys(this.state.currentTags).map((tag, index)=>{
                          var labelTags=  tag+" (" +this.state.currentTags[tag]+")";
                          var checkedTag=false;
                          var tags = this.state.tagsPosCheckBox;
                          if(tags.includes(tag))
                            checkedTag=true;
                          return <Checkbox label={labelTags} checked={checkedTag}  onClick={this.addPosTags.bind(this,tag)} />
                          })}
                          Negative
                            {Object.keys(this.state.currentTags).map((tag, index)=>{
                              var labelTags=  tag+" (" +this.state.currentTags[tag]+")";
                              var checkedTag=false;
                              var tags = this.state.tagsNegCheckBox;
                              if(tags.includes(tag))
                              checkedTag=true;
                                return <Checkbox label={labelTags} checked={checkedTag}  onClick={this.addNegTags.bind(this,tag)} />
                              })}
                        </div>:<div />;

    return (
      <div style={styles.content}>
        <Tabs
        onChange={this.handleChange}
        value={this.state.slideIndex}
        inkBarStyle={{background: '#7940A0' ,height: '4px'}}
        tabItemContainerStyle={{background:'#9A7BB0', height: '40px'}}>
        >
          <Tab label="Deep crawling" value={0} />
          <Tab label="Focused crawling " value={1} />
        </Tabs>
        <SwipeableViews index={this.state.slideIndex} onChangeIndex={this.handleChange}>
        <div id={"deep-crawling"} style={styles.slide}>
          <Row>
          <Col xs={6} md={6} style={{marginLeft:'0px'}}>
          <Card>
           <CardHeader
             title="Domains for crawling"
             actAsExpander={false}
             showExpandableButton={false}
             style={{fontWeight:'bold', marginBottom:"-70px"}}
           />
           <CardText expandable={false} >
              <Table id={"Annotated urls"} height={"210px"} selectable={false} multiSelectable={false} >
              <TableHeader displaySelectAll={false} enableSelectAll={false} >
                <TableRow>
                  <TableHeaderColumn >
                  </TableHeaderColumn>
                </TableRow>
                <TableRow style={heightTableStyle}>
                  <TableHeaderColumn colSpan="1" style={{textAlign: 'center'}}>
                    Annotated urls
                  </TableHeaderColumn>
                </TableRow>
              </TableHeader>
              <TableBody  showRowHover={false} displayRowCheckbox={false} deselectOnClickaway={false} stripedRows={false}>
              {
                (this.state.deepCrawlableDomainsFromTag || []).map((row, index) => (
                  <TableRow displayBorder={false} key={index} style={heightTableStyle}>
                  <TableRowColumn style={heightTableStyle}>{row[0]}</TableRowColumn>
                  </TableRow>
                ))
              }
              </TableBody>
              </Table>

              <Table id={"Added urls to deep crawl"} height={"210px"} selectable={false} multiSelectable={false} >
              <TableHeader displaySelectAll={false} enableSelectAll={false} >
                <TableRow>
                  <TableHeaderColumn >
                  </TableHeaderColumn>
                </TableRow>
                <TableRow>
                  <TableHeaderColumn colSpan="2" style={{textAlign: 'center'}}>
                    Added urls to deep crawl
                  </TableHeaderColumn>
                </TableRow>
              </TableHeader>
              <TableBody displayRowCheckbox={false} deselectOnClickaway={false} showRowHover={true} stripedRows={false}>
              {
                (this.state.deepCrawlableDomains || []).map((row, index) => (
                  <TableRow key={index}>
                  <TableRowColumn>{row[0]}</TableRowColumn>
                  <TableRowColumn style={{textAlign: 'right'}}>
                    <div>
                      <IconButton onClick={this.handleRemodeUrlFromList.bind(this,row[0], index )} tooltip="Remove" touch={true} tooltipPosition="bottom-right" tooltipStyles={{marginTop:"-53px",marginLeft:"-73px", fontSize:11,}}>
                        <RemoveURL />
                      </IconButton>
                    </div>
                  </TableRowColumn>
                  </TableRow>
                ))
              }
              </TableBody>
              </Table>
            </CardText>
          </Card>
          <RaisedButton label="Start Crawler" style={{margin: 12,}} />
          </Col>

          <Col xs={6} md={6} style={{marginLeft:'0px'}}>
            <Card id={"Recommendations"} initiallyExpanded={true} >
             <CardHeader
               title="Recommendations"
               actAsExpander={false}
               showExpandableButton={false}
               style={{fontWeight:'bold', marginBottom:"-70px",}}
             />
             <CardText expandable={false} >
                <MultiselectTable
                  rows={this.state.recommendations}
                  columnHeadings={["DOMAIN", "COUNT"]}
                  onRowSelection={this.addDomainsOnSelection}
                  resetSelection={this.state.resetSelection}
                />
                <RaisedButton
                  disabled={false}
                  style={{ height:20, marginTop: 15}}
                  labelStyle={{textTransform: "capitalize"}}
                  buttonStyle={{height:19}}
                  label="Add to deep crawl"
                  onClick={this.addDomainsForDeepCrawl}
                />
              </CardText>
             </Card>

            <Card id={"Load external urls"} initiallyExpanded={true} >
             <CardHeader
               title={<RaisedButton
                 disabled={false}
                 style={{ height:20, marginTop: 15}}
                 labelStyle={{textTransform: "capitalize", fontWeight:"bold", fontSize:14,}}
                 buttonStyle={{height:19}}
                 label="Loading external urls"
                 onClick={this.handleOpenDialogLoadUrl.bind(this)}
                 />}
               actAsExpander={false}
               showExpandableButton={false}
               style={{fontWeight:'bold',}}
             />
             <CardText expandable={true} >
             <Dialog title="Adding urls" actions={actionsLoadUrls} modal={false} open={this.state.openDialogLoadUrl} onRequestClose={this.handleCloseDialogLoadUrl.bind(this)}>
               <Row>
               <Col xs={10} md={10} style={{marginLeft:'0px'}}>
                 <TextField style={{height:200, width:'260px', fontSize: 12, marginRight:'-80px', marginTop:5, border:'solid',  Color: 'gray', borderWidth: 1, background:"white", borderRadius:"5px"}}
                   onChange={this.handleTextChangeLoadUrls.bind(this)}
                   floatingLabelText="Write urls (one by line)."
                   hintStyle={{ marginLeft:30}}
                   textareaStyle={{marginTop:30,}}
                   inputStyle={{ height:180, marginBottom:10, marginLeft:10, paddingRight:20}}
                   multiLine={true}
                   rows={6}
                   rowsMax={6}
                   floatingLabelStyle={{marginLeft:10, marginRight:30,}}
                   underlineStyle={{width:210, marginLeft:30, marginRight:30,}}
                 />
               </Col>
               </Row>
               <Row>
                 <br />
                 <FlatButton style={{marginLeft:'15px'}}
                   label="Choose URLs File"
                   labelPosition="before"
                   containerElement="label"
                   labelStyle={{textTransform: "capitalize"}}>
                   <input type="file" id="csvFileInput" onChange={this.handleFile.bind(this)} name='file' ref='file' accept=".txt"/>
                 </FlatButton>
               </Row>
             </Dialog>
             </CardText>
            </Card>
          </Col>
          </Row>
        </div>

        <div id="focused-crawling" style={styles.slide}>
        <Row>
        <Col xs={11} md={11} style={{margin:'10px'}}>
        <Card id={"Settings"} initiallyExpanded={true} >
         <CardHeader
           title="Settings"
           actAsExpander={false}
           showExpandableButton={false}
           style={{fontWeight:'bold',}}
         />
         <CardText expandable={true} >
           <Row>
             <Col xs={6} md={6}>
               <Card id={"Tags"} initiallyExpanded={true} style={styles.card}>
                <CardHeader
                  title="Tags"
                  actAsExpander={false}
                  showExpandableButton={false}
                  style={styles.cardHeader}
                />
                <CardText expandable={true} style={styles.cardMedia}>
                <Divider/>
                </CardText>
                </Card>
             </Col>
             <Col xs={4} md={4}>
               <Terms statedCard={true} sizeAvatar={20} setActiveMenu={true} showExpandableButton={false} actAsExpander={false} BackgroundColorTerm={"white"} renderAvatar={false} session={this.state.session}/>
             </Col>
           </Row>
         </CardText>
           <div title="Model Settings">
           {checkedTagsPosNeg}
           </div>
           <FlatButton label="Cancel" primary={true} onTouchTap={this.handleCloseCancelCreateModel} />

         </Card>
         </Col>
         </Row>

         <Row>
         <Col xs={5} md={5} style={{margin:'10px'}}>
         <Card id={"Crawling"} initiallyExpanded={true} >
          <CardHeader
            title="Crawling"
            actAsExpander={false}
            showExpandableButton={false}
            style={{fontWeight:'bold',}}
          />
          <CardText expandable={true} >
            <RaisedButton disabled={false} style={{ height:20, marginTop: 15, minWidth:118, width:118}} labelStyle={{textTransform: "capitalize"}} buttonStyle={{height:19}}
            label="Start Crawler" labelPosition="before" containerElement="label" />
          </CardText>
          </Card>
          </Col>

          <Col xs={6} md={6} style={{margin:'10px'}}>
          <Card id={"Model"} initiallyExpanded={true} >
           <CardHeader
             title="Model"
             actAsExpander={false}
             showExpandableButton={false}
             style={{fontWeight:'bold',}}
           />
           <CardText expandable={true} >
             <IconMenu
             iconButtonElement={<RaisedButton disabled={false} style={{height:20, marginTop: 15,minWidth:68, width:68}} labelStyle={{textTransform: "capitalize"}} buttonStyle={{height:19}}
             label="Model" labelPosition="before" containerElement="label" />} >
             <MenuItem value="1" primaryText="Create Model" />
             <MenuItem value="2" primaryText="Settings" />
             </IconMenu>
           </CardText>
           </Card>
          </Col>
         </Row>

        </div>

        </SwipeableViews>
      </div>
    );
  }
}

export default CrawlingView;
