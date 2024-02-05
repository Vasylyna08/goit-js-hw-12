import iziToast from 'izitoast';
import 'izitoast/dist/css/iziToast.min.css';

import SimpleLightbox from 'simplelightbox';
import 'simplelightbox/dist/simple-lightbox.min.css';

import axios from 'axios';

const BASE_URL = 'https://pixabay.com/api/';
const API_KEY = '41985459-07284690ed1bbc3dd300f203e';

const formEl = document.querySelector('.form');
const galleryEl = document.querySelector('.gallery');
const loaderEl = document.querySelector('.loader');
const loadButtonEl = document.querySelector('.load-button');
const liEl = document.querySelector('.gallery-item');

const hiddenClass = 'is-hidden';

let query = '';
let page = 1;
let maxPage = 0;

const refreshGallery = new SimpleLightbox('.gallery-item a', {
  captionsData: 'alt',
  captionDelay: 250,
});

formEl.addEventListener('submit', handleSearch);

async function handleSearch(event) {
  event.preventDefault();
  galleryEl.innerHTML = '';
  page = 1;
  loaderEl.classList.remove(hiddenClass);
  const form = event.currentTarget;
  query = form.elements.query.value;
  if (!query) {
    loadButtonEl.classList.add(hiddenClass);
    onFetchError();
    return;
  }
  try {
    const data = await fetchImage(query);
    maxPage = Math.ceil(data.totalHits / 40);
    createMarkup(data);

    if (data.hits.length > 0 && data.hits.length !== data.totalHits) {
      loadButtonEl.classList.remove(hiddenClass);
      loadButtonEl.addEventListener('click', handleLoadMore);
    } else if (!data.hits.length) {
      loadButtonEl.classList.add(hiddenClass);
      onFetchError();
    } else {
      loadButtonEl.classList.add(hiddenClass);
    }
  } catch (error) {
    onFetchError(error);
  } finally {
    loaderEl.classList.add(hiddenClass);
    form.reset();
  }
}

async function fetchImage(imageName, page = 1) {
  try {
    const response = await axios.get(`${BASE_URL}`, {
      params: {
        key: API_KEY,
        q: imageName,
        image_type: 'photo',
        orientation: 'horizontal',
        safesearch: true,
        page: page,
        per_page: 40,
      },
    });
    return response.data;
  } catch (error) {
    onFetchError(error);
  }
}

async function handleLoadMore() {
  page += 1;
  scrollPage();
  loadButtonEl.disabled = true;
  loaderEl.classList.remove(hiddenClass);

  try {
    const data = await fetchImage(query, page);
    createMarkup(data);
  } catch (error) {
    onFetchError(error);
  } finally {
    loadButtonEl.disabled = false;
    loaderEl.classList.add(hiddenClass);

    if (page === maxPage) {
      loadButtonEl.classList.add(hiddenClass);
      loadButtonEl.removeEventListener('click', handleLoadMore);
      iziToast.show({
        title: 'Error',
        messageColor: '#fff',
        messageSize: '20px',
        backgroundColor: '#EF4040',
        message: "We're sorry, but you've reached the end of search results.",
        position: 'bottomCenter',
      });
    }
  }
}

function createMarkup(data) {
  const markup = data.hits
    .map(
      ({
        webformatURL,
        largeImageURL,
        tags,
        likes,
        views,
        comments,
        downloads,
      }) => `
      <li class="gallery-item">
  <a class="gallery-link" href="${largeImageURL}">
    <img
      class="gallery-image"
      src="${webformatURL}"
      data-source="${largeImageURL}"
      alt="${tags}"
    />
    <p class= "gallery-text">• Likes: ${likes} • Views: ${views} • Comments: ${comments} •</span> Downloads:${downloads}</p>
  </a>
</li>`
    )
    .join('');
  galleryEl.insertAdjacentHTML('beforeend', markup);
  refreshGallery.refresh();
}

function scrollPage() {
  const twoHeight = liEl.getBoundingClientRect().height * 2;

  window.scrollBy({
    top: twoHeight,
    behavior: 'smooth',
  });
}

function onFetchError(error) {
  iziToast.error({
    title: 'Error',
    message:
      'Sorry, there are no images matching your search query. Please try again!',
    position: 'topRight',
    messageColor: '#fff',
    messageSize: '20px',
    backgroundColor: '#EF4040',
    close: false,
    closeOnClick: true,
    progressBarEasing: 'linear',
  });
}
