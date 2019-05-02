
function renderBooks(){
console.log ('sessionstorage', Modernizr.sessionstorage);




// myPage  creates variable storing some important nodes that are built with HTML (and not rendered by this function )and therefore can be determined immy after load event
var myPage ={ 
    booksContainer: document.getElementById('booksContainer'),
    pageQueryInput: document.getElementById('pageQueryInput'),
    radio:  Array.from((document.getElementById('radioInputs')).getElementsByTagName('input')),//tak chodzi pod edge wymuszone
    noBooksScreen: document.getElementById('noBooksModal'),
    noBooksScreenContent: document.getElementById('noBooksModal-content'),
    noBooksScreenCloseButton: document.getElementById('closeNoBooksScreen'),
    form: document.getElementById('queryForm'),
    resetButton: document.getElementById('resetButton'),
    }




//============================================= BASIC SESSION STORAGE OPERATIONS======================================================

function save(label, obj){sessionStorage.setItem(label, JSON.stringify(obj))};
function load(lab){const x = JSON.parse(sessionStorage.getItem(lab)); return x;};

//============================================= AUTHOR'S NAME OPERATIONS ===============================================================

    
const name ={
    getSurname: (str)=>{
        const lastspace = (str) => { return str.lastIndexOf(' ')};
        return (lastspace(str) === -1) ? str : str.slice(lastspace(str) + 1)
    },
    getFirstname:(str)=> {
        const lastspace = (str) => { return str.lastIndexOf(' ')};
        return (lastspace(str) === -1) ? str : str.slice( 0, lastspace(str))
    },
    processedFirstName: function(str){
        return "By " + this.getFirstname(str);
        }

    };


//============================================ BOOK'S OPERATIONS =============================================================================

    var books ={
        fromRemote: null,
        areInStorage:  ()=>{return load('localBooks')? true: false}, //checks whether books are in session storage
        store: (books)=>{save('localBooks', books);}, //save books to session storage
        process: function(queries, objects){return(queries === null)? objects : sort(filter(objects, queries.filter), queries.sort); },
        get:function(){return (this.areInStorage())? load("localBooks"): this.fromRemote},

    }
    
//========================================== FORM OPERATIONS ===================================================================

var form = {
//-- restores form after page reload
restore: function(query){
    
    if (query) {if (query.filter !== null) 
                        {myPage.pageQueryInput.value = query.filter;}
                if (query.sort !== null) 
                        {const sortInput = document.getElementById(query.sort); sortInput.checked = true; }
    }else{}
},
//-- grabs and returns form content
getContent: function(){

    const Queries = {}; //initiates empty object for results
    const filteredRadio = myPage.radio.filter((element) => { return (element.checked) ? true : false });//gets checked radiobutton if any
    Queries.filter = (myPage.pageQueryInput.value) ? (myPage.pageQueryInput.value) : null;//gets content of text input, im empty takes null
    Queries.sort = (filteredRadio.length > 0) ? filteredRadio[0].value : null;// adds to object only checked radio

    return Queries;
}

}

//============================================ QUERY OPERATIONS===========================================================================================
//function getQueriesFromStorage (){const session = load('queries'); return session;};

var query={

    getFromStorage: function(){return load('queries');},
    store:function(){
            const x = form.getContent();
            const areQueriesEmpty = (x.filter === null)&&(x.sort === null); 
            if(!areQueriesEmpty){save('queries',x)};
            },
    storeEvenIfEmpty:function(){
            save('queries', form.getContent());   
            },

}


//========================================== EVENT HANDLERS=============================================================================

var handler ={

    pressedEnterOnTextInput: function (ev){if(!ev) ev = window.event;
        if (ev.keyCode === 13) {
            event.preventDefault();
                if (shouldUpdate()){
                query.store();
                
                const preparedBooks = books.process(form.getContent(), books.get());
                createContent(preparedBooks);//if change in form newly prepared content is displayed;
               
                }
               
                }
    },
    preventsNonNumbersOnTextInput:function (e){
        if(!e) e = event;
        if((e.keyCode < 48 || (e.keyCode > 57 && e.keyCode < 96) || e.keyCode > 105)&&(e.keyCode !==13))
        {
            if(e.preventDefault) e.preventDefault();
            return false  
        }
    },

    changeInRadios:function(){
        query.store();
        const preparedBooks = books.process(form.getContent(), books.get());//if change in form basic books are processed inline with current queries
        createContent(preparedBooks);//if change in form newly prepared content is displayed;

    },
    AltR: function(ev){
        if(!ev) ev = window.event;
        if (ev.isComposing || ev.keyCode === 229) { //for FF unusual behaviour
            return;
            }    
        if (ev.which === 82) {clearFilters()};},

    }


    function mountHandlers() {
        const smallImages = Array.from(document.getElementsByClassName('book__cover')); 
        smallImages.forEach((element)=>{addEvent('click', element, showModal)});

        addEvent('keydown', window, handler.AltR);
        
        addEvent('change', myPage.form, handler.changeInRadios);
        
        addEvent('click', myPage.resetButton, clearFilters);
        
        addEvent('keydown', myPage.form, handler.pressedEnterOnTextInput);
        
        addEvent('keydown', myPage.pageQueryInput, handler.preventsNonNumbersOnTextInput);


        }
        
//===========================



// Here we get info whether there are books in session storage. 
//If so we continue working with them, otherwise we must fetch them
if (books.areInStorage()) {workWithLocalResources()} else {workWithRemoteResources()}

//that function fetches data but next steps are like with local data
function workWithRemoteResources() {

    fetch('https://api.myjson.com/bins/amapk')
      .then(response => response.json())
      .catch(error => alert('Wystąpił problem z połączeniem nr.', error, 'Spróbuj ponownie później'))
      .then(json => {
books.fromRemote = json;//localBooks receives what is loaded from remote source

books.store(books.fromRemote);//store books
createContent(books.fromRemote);
//prepareShowModal();//mounts handler that will display image modal on click 
//mountHandlersOnForm();//mounts handlers that will control form
mountHandlers();
});}
//////////////////////////////////////////////////////////////////////end of then/////////////////////////////////

function workWithLocalResources(){
 
const queries = query.getFromStorage();//takes queries from session storage
const temp = books.process(queries, books.get()); // performs filtration and searchon  books
createContent(temp);//creates and displays nods and content
form.restore(queries);//restores forms with storage content
mountHandlers();


}
////////////that is all as per function flow
////////////////////here below are definitions of functions used above/////////////////////////////////



/////////////////////////filtration////////////////////////////////////////////////////////////

function filter(objects, treshold){

    if (treshold === null) {return objects} //if there is no treshold it returns non - modifed argument
    else
    {
    const check =(book)=>{return (book.pages > treshold)? true: false; }
    const result = objects.filter(check);
    return result;
    }
    
    
    }
 
function sort(objects, query){
    
        if ((query === null)||(objects.length === 0)) {return objects} //if there is no treshold it returns non - modifed argument
        else
        {


            const comparator = {
                pages:  
                function(a, b){ return a.pages - b.pages; }, 
                releaseDate: 
                function (a,b){
                    const split = (a)=>{return (a.releaseDate).split('/');};
                    const reverseOrder =(a)=>{const b = a[1].concat(a[0]); return b; };
                    return Number(reverseOrder(split(a))) - Number(reverseOrder(split(b)));
                },
                author: (a, b)=>{return (name.getSurname(a.author.toLowerCase()) > name.getSurname(b.author.toLowerCase()))? true : false; }
               
            }
        objects.sort(comparator[query]);
       
        return objects;
        }
        
        
        }

/////////////////// displays information that there are no books meeting search criteria        

function showNotFoundScreen(){
    
    function hideModal(){myPage.noBooksScreen.style.display ='none'}
    myPage.noBooksScreen.style.display = "flex"; 
    addEvent('click', myPage.noBooksScreenCloseButton, hideModal);
    }

//defines creation of book modal
function showModal (ev){ 

    const modal = document.getElementById('myModal'); //gets element called myModal
    function hideModal(){modal.style.display ='none'}
    modal.style.display = "flex"; // sets its display to flex - initial value  is none;
    const src = (ev.currentTarget).dataset.href; //gets href from attr from element where event was fired
    const modalContent = document.getElementById('myModal-content');
    modalContent.innerHTML= `<span id ='close' class="myModal__close icon-circle-regular icon-times-solid "> </span><img  class = 'myModal__image' src=${src}></img>`
    const closeButton = document.getElementById('close');
    addEvent('click', closeButton, hideModal );
    
    };
//  <a class = 'book__cover'  data-href = ${bookObject.cover.large}>
    function bookContent (bookObject){
        return(
    
                    `
                    <a class = 'book__cover'  data-href = ${bookObject.cover.large}>
                                        <img itemprop = 'image' class='book__cover__image fadein' src=${bookObject.cover.small}>
                                    </a>
                                    <div class='bookInfo'>
                                        <div class='bookInfo__titleContainer'>
                                            <p class= 'bookInfo__title' itemprop ='name'>${bookObject.title}</p>
                                           
                                            
                                        </div>
                                        <div class='book__details'>
                                            <p itemprop ='author' class= "book__details_author"><span> ${name.processedFirstName(bookObject.author)}</span> ${name.getSurname(bookObject.author)}</p>
                                            <p itemprop ='datePublished'><span>Release Date:</span> ${bookObject.releaseDate}</p>
                                            <p itemprop = 'numberOfPages'><span>Pages:</span> ${bookObject.pages}</p>
                                            <p itemprop ='discussionUrl'><span>Link:</span> <a href = ${bookObject.link}>shop</a></p>
                                        </div>
                                    </div>
    
    
                    `
                )
    
    }


///////////////////////////////////////that functions should create content
function createContent (items){
    console.log('createcontent');
//removes event listeners before removes nodes (see below) to prevent possible memory leakage
    if (myPage.booksContainer.hasChildNodes()){ 
            const nodes = Array.from(myPage.booksContainer.getElementsByClassName('book__cover'));
            if(nodes.length > 0){nodes.forEach( (element)=>{element.removeEventListener(event, showModal, false)})};
    
    }
// clears existing nodes with books if any before displaying new ones
    while (myPage.booksContainer.hasChildNodes()) {myPage.booksContainer.removeChild(myPage.booksContainer.lastChild);}
///// here is proper creating of book nodes    
    const numberOfBooks = items.length;
    
    if (numberOfBooks >0){
    
        for (let i = 1; i <= numberOfBooks; i++ ){
       
            const el = document.createElement("li");
            el.classList.add('book');
            el.setAttribute("itemtype", "http://schema.org/Book");
            el.setAttribute('itemscope', '');
            el.dataset.number = i;
            el.innerHTML = bookContent(items[i-1]);
            myPage.booksContainer.appendChild(el);
        }
    } else {showNotFoundScreen()}
   
    }
////////////////////////////////////clears queries
function clearFilters (){

const x = form.getContent();
const isEmpty =  (x.filter === null)&&(x.sort === null); //checks whether when this function was called, filter was empty  
myPage.pageQueryInput.value = null; // clear text input   
myPage.radio.forEach((element) => {element.checked = false;});// clears radios
query.storeEvenIfEmpty();
if (!isEmpty) {createContent(books.get());}; //only if initially form was not empty, books will be re-rendered
 }
 
function shouldUpdate(){
    return (JSON.stringify(form.getContent()) !== JSON.stringify(query.getFromStorage()))? true: false;
    
    }
///////////////////////// universal event mounter with fix for IE
function addEvent(evnt, elem, func) {
    if (elem.addEventListener)  // W3C DOM
       elem.addEventListener(evnt,func,false);
    else if (elem.attachEvent) { // IE DOM
       elem.attachEvent("on"+evnt, func);
    }
    else { 
       elem["on"+evnt] = func;
    }
 }

}


