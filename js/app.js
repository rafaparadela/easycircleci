$(document).ready(function() {
    $.ajaxSetup({ cache: false });
    
    checkToken();
    
});

var circleciBaseURL = 'https://circleci.com/api/';
var apiVersion = 'v1/';

var token = false;
// var token = 'e3c0e0dd447ccc5725eb02c68c5b7efb9686f75c';
var myUsername = false;
var myName = false;

var projectsInterval;
var detailInterval;
var projectsCounter;
var detailCounter;

var hash = false;

// HASH
$(window).on('hashchange', function() {
    studyHash();
});

function studyHash() {
    hash = window.location.hash.substring(1);
    var items = hash.split('/');
    if(items.length < 4) getBuilds();
    else loadBuildDetails(items[1], items[2], items[3]);
}

function cleanHash() {
    window.location.hash = '';
}

// Status

function setOn() {
    $('#onContent').removeClass();
    $('#intro').addClass('animated fadeOutDown');
    $('#intro').one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function(){
        $('#onContent').css({'z-index':1});
        $('#intro').css({'z-index':0});
    });
}

function setOff() {
    $('#intro').removeClass();
    $('#onContent').addClass('animated fadeOutDown');
    $('#onContent').one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function(){
        $('#intro').css({'z-index':1});
        $('#onContent').css({'z-index':0});
    });
}


function checkToken() {
    token = readToken();
    if(token){
        // $('#apitoken').val(token);
        runApp();
    }
    else setOff();
    
    $('#apitoken').change(function(event) {
        // Act on the event
    });
}

function saveToken() {
    var t = $('#apitoken').val();
    if(t.length>0){
        writeToken(t);
        checkToken();
        $('#tokenModal').modal('hide');
    }
    else{
        showAniming($('#apitoken'), 'shake', false);
    }
}

function forgetToken() {
    $('#apitoken').val('');
    removeToken();
    cleanLocalStorage();
    token = false;
    checkToken();
    $('#logout').fadeOut(function(){
        $('#login').fadeIn();
        $('#myPic').attr('src','');
        $('#circleCIwrapper').empty();
        
    });
}

function runApp() {
    meInfo();
}

function meInfo() {    
    $.getJSON(endpointURL('me'))
    .done(function( data ) {
        studyHash();
        $('#myPic').attr('src',data.avatar_url);
        myUsername = data.login;
        myName = data.name;
        var names = myName.split(' ');
        $('#myName').html(names.slice(0,-1).join(" ")+' <strong>'+names.slice(-1)+'</strong>');
        $("[data-toggle=popover]").popover();
        $("[data-toggle=popover]").on('shown.bs.popover', function () {
            $('#forgetMe').click(function(){
                forgetToken();
            });
        })
     }).fail(function(jqXHR) {
         forgetToken();
     });
      
}

function getBuilds() {
    
    $.getJSON(endpointURL('projects'))
    .done(function( data ) {     
        $('#circleCIwrapper').empty();
        $.each(data, function(index, project) {
            printProject(project);
        });
        orderBuilds();
        initProjectCounter();
        setOn();
     }).fail(function(jqXHR) {
         alert('Peta builds');
     });
}

function printProject(project) {
    
    var repoWrapper = $('<div></div>').attr({'class':'repoWrapper', 'data-username':project.username, 'data-project':project.reponame}); $('#circleCIwrapper').append(repoWrapper);
        var repoRowTitle = $('<div></div>').attr({'class':'row title'}); repoWrapper.append(repoRowTitle);
            var firstCol = $('<div></div>').attr({'class':'col col-xs-8'}); repoRowTitle.append(firstCol);
                var title = $('<h4></h4>').text(addSpace(project.reponame)); firstCol.append(title);
            var secondCol = $('<div></div>').attr({'class':'col col-xs-4'}); repoRowTitle.append(secondCol);
            var pRight = $('<div></div>').attr({'class':'pull-right externs'}); secondCol.append(pRight);

                    var gitHubSpan = $('<a></a>').attr({'href':project.vcs_url, 'target':'_blank'}).text('GitHub'); pRight.append(gitHubSpan);
                    var circlCISpan = $('<a></a>').attr({'href':'https://circleci.com/gh/'+project.username+'/'+project.reponame, 'target':'_blank'}).text('CircleCI'); pRight.append(circlCISpan);
                    

        var branchesWrapper = $('<div></div>').attr({'class':'branchesWrapper row'}); repoWrapper.append(branchesWrapper);

        var repo_date_last_build = 0;
        var branchesNum = 0;
        $.each(project.branches, function(branch_index, branch) {
            
           
            
            if(branch.pusher_logins != undefined){
                if(branch.pusher_logins.indexOf(myUsername)!=-1){
                     console.log(branch);
                    branchesNum++;
                    var buildWrapper = $('<div></div>').attr({'class':'col col-md-6 buildWrapper'}); branchesWrapper.append(buildWrapper);
                        var widget = $('<div></div>').attr({'class':'widget'}); buildWrapper.append(widget);
                        
                            var branchWrapper = $('<div></div>').attr({'class':'title'}).text(getBranchTitle(branch_index)); widget.append(branchWrapper);
                            var branchWrapper = $('<div></div>').attr({'class':'branch'}).text(branch_index); widget.append(branchWrapper);
                            var buildsWrapper = $('<div></div>').attr({'class':'builds clearfix'}); widget.append(buildsWrapper);

                    var date_last_build = 0;

                    $.each(branch.running_builds.concat(branch.recent_builds), function(builds_index, build) {
                        var mydate = new Date(build.added_at).getTime();
                        if(mydate>date_last_build) date_last_build=mydate;
                        
                        var buildButton = $('<div></div>').attr({'class':'build '+build.status, 'data-build-num':build.build_num}); buildsWrapper.append(buildButton);
                            var buildButtonNumber = $('<div></div>').attr({'class':'number'}).text(build.build_num); buildButton.append(buildButtonNumber);
                            var buildButtonDate = $('<div></div>').attr({'class':'date'}).text(getDateAgo(build.added_at)); buildButton.append(buildButtonDate);
                        
                        buildButton.click(function(event) {
                            window.location.hash = 'project/'+project.username+'/'+project.reponame+'/'+build.build_num;
                            // loadBuildDetails(project.username, project.reponame, build.build_num);
                        });
                    });

                    buildWrapper.attr('data-date-build',date_last_build);

                    if(date_last_build > repo_date_last_build) repo_date_last_build = date_last_build;
                }
            }
        });
        
        if(branchesNum > 0){
            orderBranches(repoWrapper)
            repoWrapper.attr('data-date-build', repo_date_last_build);
        }
        else{
            repoWrapper.remove();
        }

}

function orderBranches(reposWrapper) {
    var branchesWrapper = reposWrapper.find('div.branchesWrapper');
    var repos = branchesWrapper.find('div.buildWrapper');
    repos.detach().sort(function(a, b) {
                var astts = $(a).attr('data-date-build');
                var bstts = $(b).attr('data-date-build');
                return (astts > bstts) ? (astts > bstts) ? -1 : 0 : 1;
            });

    branchesWrapper.append(repos);
}

function orderBuilds() {
    var reposWrapper = $('#circleCIwrapper')
    var repos = reposWrapper.find('.repoWrapper');
    

    repos.detach().sort(function(a, b) {
                var astts = $(a).attr('data-last-build');
                var bstts = $(b).attr('data-last-build');
                return (astts > bstts) ? (astts > bstts) ? 1 : 0 : -1;
            });
            


    reposWrapper.append(repos);
}

function endpointURL(method) {
   return circleciBaseURL+apiVersion+method+'?circle-token='+token
}


//Modals

function modalToken() {
    $('#tokenModal').modal('show');
}

function loadBuildDetails(username, project, build) {
    var endpoint = 'project/'+username+'/'+project+'/'+build;
    $.getJSON(endpointURL(endpoint))
    .done(function( data ) {
        fillBuildDetails(data, username, project, build);
     }).fail(function(jqXHR) {
         alert('petaa');
     });;
}

function cancelBuild(username, project, build) {
    $.post(endpointURL('project/'+username+'/'+project+'/'+build+'/cancel'));
    
    $('#circleCIwrapper').empty();

     setTimeout(function(){
         getBuilds();
     }, 500);
 			
}

function retryBuild(username, project, build) {
    $.post(endpointURL('project/'+username+'/'+project+'/'+build+'/retry'));
    
    $('#circleCIwrapper').empty();
    
    setTimeout(function(){
        getBuilds();
    }, 500);
}

function fillBuildDetails(data, username, project, build) {
    $('#circleCIwrapper').empty();
    
    var rowTitle = $('<div></div>').attr({'id':'buildDetails', 'class':'row'}); $('#circleCIwrapper').append(rowTitle);
        var firstCol = $('<div></div>').attr({'class':'col-xs-6'}); rowTitle.append(firstCol);
            var title = $('<h4></h4>').attr({'class':data.status}).text(data.build_num+' ['+data.status+']'); firstCol.append(title);
                var backButton = $('<i></i>').attr({'class':'fa fa-arrow-circle-left'}); title.prepend(backButton);
                backButton.click(function(event) {
                    cleanHash();
                });
            
        var secondCol = $('<div></div>').attr({'class':'col col-xs-6'}); rowTitle.append(secondCol);
            var pRight = $('<div></div>').attr({'class':'pull-right'}); secondCol.append(pRight);
                var cancelButton = $('<btn></btn>').attr({'class':'btn btn-xs btn-default'}).html('<i class="fa fa-times"></i> Cancel'); pRight.append(cancelButton);
                cancelButton.click(function(event) {
                    cancelBuild(username, project, build);
                });
                var rebuildButton = $('<btn></btn>').attr({'class':'btn btn-xs btn-default'}).html('<i class="fa fa-repeat"></i> Rebuild'); pRight.append(rebuildButton);
                rebuildButton.click(function(event) {
                    retryBuild(username, project, build);
                });
    
    var rowAuthor = $('<div></div>').attr({'class':'row'}); $('#circleCIwrapper').append(rowAuthor);
        var firstCol = $('<div></div>').attr({'class':'col-key col-xs-2'}).text('Author:'); rowAuthor.append(firstCol);
        var secondCol = $('<div></div>').attr({'class':'col col-xs-10'}).html('<a href="https://github.com/'+data.all_commit_details[0].committer_login+'" target="_blank">'+data.all_commit_details[0].committer_name+'</a>'); rowAuthor.append(secondCol);
    
    var rowCircleCI = $('<div></div>').attr({'class':'row'}); $('#circleCIwrapper').append(rowCircleCI);
        var firstCol = $('<div></div>').attr({'class':'col-key col-xs-2'}).text('CircleCI:'); rowCircleCI.append(firstCol);
        var secondCol = $('<div></div>').attr({'class':'col col-xs-10'}).html('<a href="'+data.build_url+'" target="_blank">View in CircleCI</a>'); rowCircleCI.append(secondCol);
    
    var rowCommit = $('<div></div>').attr({'class':'row'}); $('#circleCIwrapper').append(rowCommit);
        var firstCol = $('<div></div>').attr({'class':'col-key col-xs-2'}).text('Commit:'); rowCommit.append(firstCol);
        var secondCol = $('<div></div>').attr({'class':'col col-xs-10'}).html('<a href="'+data.all_commit_details[0].commit_url+'" target="_blank">'+data.all_commit_details[0].subject+'</a>'); rowCommit.append(secondCol);
    
    var rowSteps = $('<div></div>').attr({'id':'steps', 'class':'row'}); $('#circleCIwrapper').append(rowSteps);
        var firstCol = $('<div></div>').attr({'class':'col-key col-step-title col-xs-12'}).text('Steps:'); rowSteps.append(firstCol);
        var buildSteps = $('<div></div>').attr({'id':'buildSteps', 'class':'col col-xs-12'}); rowSteps.append(buildSteps);

    $.each(data.steps, function(index, step) {
        var step_div = $('<div></div>').attr({'class':'step '+step.actions[0].status}).text(step.name); buildSteps.append(step_div);
        if(step.actions[0].has_output){
            if(step.actions[0].status == 'running'){
                var log_span = $('<span></span>').attr({'class':'pull-right'}).html('<i class="fa fa-spin fa-refresh"></i>'); step_div.prepend(log_span);
            }
            else{
                var log_span = $('<span></span>').attr({'class':'pull-right label label-default'}).text('LOG'); step_div.prepend(log_span);
                log_span.click(function(event) {
                    printLog(step.actions[0].output_url);
                });
            }
            
        }
    });
    
    initDetailCounter();
}

function printLog(url) {
    $('#log').html("Loading...");
    $('#logModal').modal('show');
    
    $.getJSON(url)
    .done(function( data ) {
        console.log(data);
        $('#log').html(data[0].message);
     }).fail(function(jqXHR) {
         $('#log').html("Error :-(");
     });;

}


//Countdowns

function initProjectCounter() {
    
    $('#tempo').unbind('click').click(function(){
        fireProjects();
    });
    clearInterval(projectsInterval);
    clearInterval(detailInterval);
    projectsCounter = 20;
    projectsInterval = setInterval(function(){ updateProjectCounter()}, 1000);
}

function updateProjectCounter() {
    if(projectsCounter < 0) fireProjects();
    else{
        $('#tempo').text(projectsCounter);
        projectsCounter--;
    }
}

function fireProjects() {
    $('#tempo').html('<i class="fa fa-cog fa-spin"></i>');
    clearInterval(projectsInterval);
    getBuilds();
}


function initDetailCounter() {
    $('#tempo').unbind('click').click(function(){
        fireDetail();
    });
    clearInterval(projectsInterval);
    clearInterval(detailInterval);
    detailCounter = 8;
    detailInterval = setInterval(function(){ updateDetailCounter()}, 1000);
}

function updateDetailCounter() {
    if(detailCounter < 0) fireDetail();
    else{
        $('#tempo').text(detailCounter);
        detailCounter--;
    }
}

function fireDetail() {
    $('#tempo').html('<i class="fa fa-cog fa-spin"></i>');
    clearInterval(detailInterval);
    studyHash();
}



// Local Storage

function writeToken(t) {
    localStorage.setItem("circleciapitoken", t);
    token = t
}

function readToken() {
    var dev = false
    if(localStorage.getItem("circleciapitoken")) dev = localStorage.getItem("circleciapitoken");
    return dev;
}

function removeToken() {
    localStorage.removeItem("circleciapitoken");
}

function cleanLocalStorage() {
    localStorage.clear();
}


// Anima
function showAniming(element,animation,callback) {
    element.addClass('animated').addClass(animation);
    var wait = window.setTimeout( function(){
        element.removeClass('animated').removeClass(animation);
        if (typeof callback == "function") setTimeout(function(){ callback(); },10); 
    },1300);
}


//highlight
function syntaxHighlight(obj) {
    var json = JSON.stringify(obj, undefined, 2);
    json = json.replace(/&/g, '&').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
        var cls = 'number';
        if (/^"/.test(match)) {
            if (/:$/.test(match)) {
                cls = 'key';
            } else {
                cls = 'string';
            }
        } else if (/true|false/.test(match)) {
            cls = 'boolean';
        } else if (/null/.test(match)) {
            cls = 'null';
        }
        return '<span class="' + cls + '">' + match + '</span>';
    });
}

//Utils

function getBranchTitle(branch) {
  var dev = branch;
  var re = /(\S+)-(\d+)-(\S+)/; 
  var m = re.exec(branch);
  if(m){
    var ticket = m[2];
    var title = m[3].replace(/-/g, " ");
    dev = title;
    var prefix = m[1].split("-");
    if(prefix.length>1) ticket = prefix.pop()+"-"+ticket;
    else ticket = prefix+"-"+ticket;
  }
  else dev = extractFin(branch);

  return dev;
}

function extractFin(branch) {
    var dev = branch;
    var re = /(\S+)-fin-(\S+)/i;
    var m = re.exec(branch);
    if(m){
        var title = m[2].replace(/-/g, " ");
        dev = title;
    }
    return dev;
}

function getDateAgo(added) {
  
  var seconds = Math.floor((new Date() - new Date(added)) / 1000);

    var interval = Math.floor(seconds / 31536000);

    if (interval > 1) {
        return interval + " years";
    }
    interval = Math.floor(seconds / 2592000);
    if (interval > 1) {
        return interval + " months";
    }
    interval = Math.floor(seconds / 86400);
    if (interval > 1) {
        return interval + " days";
    }
    interval = Math.floor(seconds / 3600);
    if (interval > 1) {
        return interval + " h.";
    }
    interval = Math.floor(seconds / 60);
    if (interval > 1) {
        return interval + " min.";
    }
    return Math.floor(seconds) + " sec.";
}

function addSpace(str) {
    return str.replace('_', ' ');
}

function buildClasses(status) {
    switch (status) {
        case 'retried': var statusClass = 'label-danger'; break;
        case 'running': var statusClass = 'label-primary'; break;
        case 'queued': var statusClass = 'label-primary'; break;
        case 'scheduled': var statusClass = 'label-primary'; break;
        case 'canceled': var statusClass = 'label-default'; break;
        case 'not_running': var statusClass = 'label-default'; break;
        case 'not_run': var statusClass = 'label-default'; break;
        case 'queued': var statusClass = 'label-default'; break;
        case 'infrastructure_fail': var statusClass = 'label-danger'; break;
        case 'failed': var statusClass = 'label-danger'; break;
        case 'timedout': var statusClass = 'label-danger'; break;
        case 'success': var statusClass = 'label-success'; break;
        case 'fixed': var statusClass = 'label-success'; break;
        default: var statusClass = 'label-default'; break;
    }
    return statusClass;
}


