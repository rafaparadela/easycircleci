$(document).ready(function() {
    $.ajaxSetup({ cache: false });
    
    activeLogout();
    checkToken();
    
    
});

var circleciBaseURL = 'https://circleci.com/api/';
var apiVersion = 'v1/';

var token = false;
// var token = 'e3c0e0dd447ccc5725eb02c68c5b7efb9686f75c';
var myUsername = false;




function checkToken() {
    token = readToken();
    if(token){
        $('#apitoken').val(token);
        runApp();
    }
    else modalToken();
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
        getBuilds();
        $('#myPic').attr('src',data.avatar_url);
        myUsername = data.login;
        $('#login').fadeOut(function(){ $('#logout').removeClass('hidden').fadeIn(); });
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
     }).fail(function(jqXHR) {
         alert('Peta builds');
     });
}

function printProject(project) {
    
    var repoWrapper = $('<div></div>').attr({'class':'repoWrapper', 'data-username':project.username, 'data-project':project.reponame}); $('#circleCIwrapper').append(repoWrapper);
        var repoRowTitle = $('<div></div>').attr({'class':'row title'}); repoWrapper.append(repoRowTitle);
            var firstCol = $('<div></div>').attr({'class':'col col-xs-6'}); repoRowTitle.append(firstCol);
                var title = $('<h4></h4>').text(addSpace(project.reponame)); firstCol.append(title);
            var secondCol = $('<div></div>').attr({'class':'col col-xs-6'}); repoRowTitle.append(secondCol);
                var pRight = $('<div></div>').attr({'class':'pull-right'}); secondCol.append(pRight);
                    var gitHubSpan = $('<btn></btn>').attr({'class':'btn btn-xs btn-default'}).html('<i class="fa fa-sign-out"></i> GitHub'); pRight.append(gitHubSpan);
                    var circlCISpan = $('<btn></btn>').attr({'class':'btn btn-xs btn-default'}).html('<i class="fa fa-sign-out"></i> CircleCI'); pRight.append(circlCISpan);
    

        var branchesWrapper = $('<div></div>').attr({'class':'branchesWrapper'}); repoWrapper.append(branchesWrapper);

        $.each(project.branches, function(branch_index, branch) {
            if(branch.pusher_logins.indexOf(myUsername)!=-1){
                var buildWrapper = $('<div></div>').attr({'class':'row buildWrapper'}); branchesWrapper.append(buildWrapper);
                    var firstCol = $('<div></div>').attr({'class':'col col-md-6'}); buildWrapper.append(firstCol);
                        var branchWrapper = $('<div></div>').attr({'class':'branch'}).text(branch_index); firstCol.append(branchWrapper);
                    var secondCol = $('<div></div>').attr({'class':'col col-md-6'}); buildWrapper.append(secondCol);
                        var buildsWrapper = $('<div></div>').attr({'class':'builds'}); secondCol.append(buildsWrapper);
                       
                $.each(branch.running_builds.concat(branch.recent_builds), function(builds_index, build) {
                    var buildButton = $('<span></span>').attr({'class':'label '+buildClasses(build.status), 'data-build-num':build.build_num}).text(build.build_num); buildsWrapper.append(buildButton);
                    buildButton.click(function(event) {
                        loadBuildDetails(project.username, project.reponame, build.build_num);
                    });
                }); 
                
            }

        });

    }


function endpointURL(method) {
   return circleciBaseURL+apiVersion+method+'?circle-token='+token
}


//Modals

function modalToken() {
    $('#tokenModal').modal('show');
}

function loadBuildDetails(username, project, build) {
    $.getJSON(endpointURL('project/'+username+'/'+project+'/'+build))
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
                    getBuilds();
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
            var log_span = $('<span></span>').attr({'class':'pull-right label label-default'}).text('LOG'); step_div.prepend(log_span);
            log_span.click(function(event) {
                printLog(step.actions[0].output_url);
            });
        }
    });
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


function activeLogout() {
    $('#logout').on({
      mouseenter: function() {
        $(this).addClass( "inside" );
      }, mouseleave: function() {
        $(this).removeClass( "inside" );
      }
    });
    
   
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


