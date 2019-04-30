"use strict";

function renderBooks() {
  console.log('render');
  console.log(document.getElementById('booksContainer'));
  console.log(document.getElementById('pageQueryInput')); // myPage  creates variable storing some important nodes that are built with HTML (and not rendered by this function )and therefore can be determined immy after load event

  var myPage = {
    booksContainer: document.getElementById('booksContainer'),
    pageQueryInput: document.getElementById('pageQueryInput'),
    radio: Array.from(document.getElementById('radioInputs').getElementsByTagName('input')),
    //tak chodzi pod edge wymuszone
    noBooksScreen: document.getElementById('noBooksModal'),
    noBooksScreenContent: document.getElementById('noBooksModal-content'),
    noBooksScreenCloseButton: document.getElementById('closeNoBooksScreen'),
    form: document.getElementById('queryForm'),
    resetButton: document.getElementById('resetButton') //============================================= BASIC SESSION STORAGE OPERATIONS======================================================

  };

  function save(label, obj) {
    sessionStorage.setItem(label, JSON.stringify(obj));
  }

  ;

  function load(lab) {
    var x = JSON.parse(sessionStorage.getItem(lab));
    return x;
  }

  ; //============================================= AUTHOR'S NAME OPERATIONS ===============================================================

  var name = {
    getSurname: function getSurname(str) {
      var lastspace = function lastspace(str) {
        return str.lastIndexOf(' ');
      };

      return lastspace(str) === -1 ? str : str.slice(lastspace(str) + 1);
    },
    getFirstname: function getFirstname(str) {
      var lastspace = function lastspace(str) {
        return str.lastIndexOf(' ');
      };

      return lastspace(str) === -1 ? str : str.slice(0, lastspace(str));
    },
    processedFirstName: function processedFirstName(str) {
      return "By " + this.getFirstname(str);
    }
  }; //============================================ BOOK'S OPERATIONS =============================================================================

  var books = {
    fromRemote: null,
    areInStorage: function areInStorage() {
      return load('localBooks') ? true : false;
    },
    //checks whether books are in session storage
    store: function store(books) {
      save('localBooks', books);
    },
    //save books to session storage
    process: function process(queries, objects) {
      return queries === null ? objects : sort(filter(objects, queries.filter), queries.sort);
    },
    get: function get() {
      return this.areInStorage() ? load("localBooks") : localBooks;
    } //========================================== FORM OPERATIONS ===================================================================

  };
  var form = {
    //-- restores form after page reload
    restore: function restore(query) {
      if (query) {
        if (query.filter !== null) {
          myPage.pageQueryInput = query.filter;
        }

        if (query.sort !== null) {
          var sortInput = document.getElementById(query.sort);
          sortInput.checked = true;
        }
      } else {
        console.log('empty query');
      }
    },
    //-- grabs and returns form content
    getContent: function getContent() {
      var Queries = {}; //initiates empty object for results

      var filteredRadio = myPage.radio.filter(function (element) {
        return element.checked ? true : false;
      }); //gets checked radiobutton if any

      Queries.filter = myPage.pageQueryInput.value ? myPage.pageQueryInput.value : null; //gets content of text input, im empty takes null

      Queries.sort = filteredRadio.length > 0 ? filteredRadio[0].value : null; // adds to object only checked radio

      return Queries;
    } //============================================ QUERY OPERATIONS===========================================================================================
    //function getQueriesFromStorage (){const session = load('queries'); return session;};

  };
  var query = {
    getFromStorage: function getFromStorage() {
      return load('queries');
    },
    store: function store() {
      var x = form.getContent();
      var areQueriesEmpty = x.filter === null && x.sort === null;

      if (!areQueriesEmpty) {
        save('queries', x);
      }

      ;
    },
    storeEvenIfEmpty: function storeEvenIfEmpty() {
      save('queries', form.getContent());
    } //========================================== EVENT HANDLERS=============================================================================

  };
  var handler = {
    pressedEnterOnTextInput: function pressedEnterOnTextInput(ev) {
      if (!ev) ev = window.event;

      if (ev.keyCode === 13) {
        event.preventDefault();

        if (shouldUpdate()) {
          query.store();
          var preparedBooks = books.process(form.getContent(), books.get());
          createContent(preparedBooks); //if change in form newly prepared content is displayed;
        }
      }
    },
    preventsNonNumbersOnTextInput: function preventsNonNumbersOnTextInput(e) {
      if (!e) e = event;

      if ((e.keyCode < 48 || e.keyCode > 57 && e.keyCode < 96 || e.keyCode > 105) && e.keyCode !== 13) {
        if (e.preventDefault) e.preventDefault();
        return false;
      }
    },
    changeInRadios: function changeInRadios() {
      query.store();
      var preparedBooks = books.process(form.getContent(), books.get()); //if change in form basic books are processed inline with current queries

      createContent(preparedBooks); //if change in form newly prepared content is displayed;
    },
    AltR: function AltR(ev) {
      if (!ev) ev = window.event;

      if (ev.isComposing || ev.keyCode === 229) {
        //for FF unusual behaviour
        return;
      }

      if (ev.which === 82) {
        clearFilters();
      }

      ;
    }
  };

  function mountHandlers() {
    var smallImages = Array.from(document.getElementsByClassName('book__cover'));
    smallImages.forEach(function (element) {
      addEvent('click', element, showModal);
    });
    addEvent('keydown', window, handler.AltR);
    addEvent('change', myPage.form, handler.changeInRadios);
    addEvent('click', myPage.resetButton, clearFilters);
    addEvent('keydown', myPage.form, handler.pressedEnterOnTextInput);
    addEvent('keydown', myPage.pageQueryInput, handler.preventsNonNumbersOnTextInput);
  } //===========================
  // Here we get info whether there are books in session storage. 
  //If so we continue working with them, otherwise we must fetch them


  if (books.areInStorage()) {
    workWithLocalResources();
  } else {
    workWithRemoteResources();
  } //that function fetches data but next steps are like with local data


  function workWithRemoteResources() {
    console.log('remoteResources');
    fetch('https://api.myjson.com/bins/amapk').then(function (response) {
      return response.json();
    }).catch(function (error) {
      return alert('Wystąpił problem z połączeniem nr.', error, 'Spróbuj ponownie później');
    }).then(function (json) {
      books.fromRemote = json; //localBooks receives what is loaded from remote source

      console.log('booksfromremote', books.fromRemote);
      books.store(books.fromRemote); //store books

      createContent(books.fromRemote); //prepareShowModal();//mounts handler that will display image modal on click 
      //mountHandlersOnForm();//mounts handlers that will control form

      mountHandlers();
    });
  } //////////////////////////////////////////////////////////////////////end of then/////////////////////////////////


  function workWithLocalResources() {
    var queries = query.getFromStorage(); //takes queries from session storage

    var temp = books.process(queries, books.get()); // performs filtration and searchon  books

    createContent(temp); //creates and displays nods and content

    form.restore(queries); //restores forms with storage content

    mountHandlers();

    if (Modernizr.sessionstorage) {
      console.log(Modernizr.sessionstorage);
    } else {// not-supported
    }
  } ////////////that is all as per function flow
  ////////////////////here below are definitions of functions used above/////////////////////////////////
  /////////////////////////filtration////////////////////////////////////////////////////////////


  function filter(objects, treshold) {
    if (treshold === null) {
      return objects;
    } //if there is no treshold it returns non - modifed argument
    else {
        var check = function check(book) {
          return book.pages > treshold ? true : false;
        };

        var result = objects.filter(check);
        return result;
      }
  }

  function sort(objects, query) {
    if (query === null || objects.length === 0) {
      return objects;
    } //if there is no treshold it returns non - modifed argument
    else {
        var comparator = {
          pages: function pages(a, b) {
            return a.pages - b.pages;
          },
          releaseDate: function releaseDate(a, b) {
            var split = function split(a) {
              return a.releaseDate.split('/');
            };

            var reverseOrder = function reverseOrder(a) {
              var b = a[1].concat(a[0]);
              return b;
            };

            return Number(reverseOrder(split(a))) - Number(reverseOrder(split(b)));
          },
          author: function author(a, b) {
            return name.getSurname(a.author.toLowerCase()) > name.getSurname(b.author.toLowerCase()) ? true : false;
          }
        };
        objects.sort(comparator[query]);
        return objects;
      }
  } /////////////////// displays information that there are no books meeting search criteria        


  function showNotFoundScreen() {
    function hideModal() {
      myPage.noBooksScreen.style.display = 'none';
    }

    myPage.noBooksScreen.style.display = "flex";
    addEvent('click', myPage.noBooksScreenCloseButton, hideModal);
  } //defines creation of book modal


  function showModal(ev) {
    var modal = document.getElementById('myModal'); //gets element called myModal

    function hideModal() {
      modal.style.display = 'none';
    }

    modal.style.display = "flex"; // sets its display to flex - initial value  is none;

    var src = ev.currentTarget.dataset.href; //gets href from attr from element where event was fired

    var modalContent = document.getElementById('myModal-content');
    modalContent.innerHTML = "<span id ='close' class=\"myModal__close icon-circle-regular icon-times-solid \"> </span><img  class = 'myModal__image' src=".concat(src, "></img>");
    var closeButton = document.getElementById('close');
    addEvent('click', closeButton, hideModal);
  }

  ; //  <a class = 'book__cover'  data-href = ${bookObject.cover.large}>

  function bookContent(bookObject) {
    return "\n                    <a class = 'book__cover'  data-href = ".concat(bookObject.cover.large, ">\n                                        <img itemprop = 'image' class='book__cover__image fadein' src=").concat(bookObject.cover.small, ">\n                                    </a>\n                                    <div class='bookInfo'>\n                                        <div class='bookInfo__titleContainer'>\n                                            <p class= 'bookInfo__title' itemprop ='name'>").concat(bookObject.title, "</p>\n                                           \n                                            \n                                        </div>\n                                        <div class='book__details'>\n                                            <p itemprop ='author' class= \"book__details_author\"><span> ").concat(name.processedFirstName(bookObject.author), "</span> ").concat(name.getSurname(bookObject.author), "</p>\n                                            <p itemprop ='datePublished'><span>Release Date:</span> ").concat(bookObject.releaseDate, "</p>\n                                            <p itemprop = 'numberOfPages'><span>Pages:</span> ").concat(bookObject.pages, "</p>\n                                            <p itemprop ='discussionUrl'><span>Link:</span> <a href = ").concat(bookObject.link, ">shop</a></p>\n                                        </div>\n                                    </div>\n    \n    \n                    ");
  } ///////////////////////////////////////that functions should create content


  function createContent(items) {
    console.log('createcontent'); //removes event listeners before removes nodes (see below) to prevent possible memory leakage

    if (myPage.booksContainer.hasChildNodes()) {
      var nodes = Array.from(myPage.booksContainer.getElementsByClassName('book__cover'));

      if (nodes.length > 0) {
        nodes.forEach(function (element) {
          element.removeEventListener(event, showModal, false);
        });
      }

      ;
    } // clears existing nodes with books if any before displaying new ones


    while (myPage.booksContainer.hasChildNodes()) {
      myPage.booksContainer.removeChild(myPage.booksContainer.lastChild);
    } ///// here is proper creating of book nodes    


    var numberOfBooks = items.length;

    if (numberOfBooks > 0) {
      for (var i = 1; i <= numberOfBooks; i++) {
        var el = document.createElement("li");
        el.classList.add('book');
        el.setAttribute("itemtype", "http://schema.org/Book");
        el.setAttribute('itemscope', '');
        el.dataset.number = i;
        el.innerHTML = bookContent(items[i - 1]);
        myPage.booksContainer.appendChild(el);
      }
    } else {
      showNotFoundScreen();
    }
  } ////////////////////////////////////clears queries


  function clearFilters() {
    var x = form.getContent();
    var isEmpty = x.filter === null && x.sort === null; //checks whether when this function was called, filter was empty  

    myPage.pageQueryInput.value = null; // clear text input   

    myPage.radio.forEach(function (element) {
      element.checked = false;
    }); // clears radios

    query.storeEvenIfEmpty();

    if (!isEmpty) {
      createContent(books.get());
    }

    ; //only if initially form was not empty, books will be re-rendered
  }

  function shouldUpdate() {
    return JSON.stringify(form.getContent()) !== JSON.stringify(query.getFromStorage()) ? true : false;
  } ///////////////////////// universal event mounter with fix for IE


  function addEvent(evnt, elem, func) {
    if (elem.addEventListener) // W3C DOM
      elem.addEventListener(evnt, func, false);else if (elem.attachEvent) {
      // IE DOM
      elem.attachEvent("on" + evnt, func);
    } else {
      elem["on" + evnt] = func;
    }
  }
}