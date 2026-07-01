export function createAppState() {
  return {
    quads: [],
    currentQuadId: null,
    currentSlide: 0,
  };
}

export function setCurrentQuadId(state, quadId) {
  state.currentQuadId = quadId;
}

export function resetCurrentQuadId(state) {
  state.currentQuadId = null;
}

export function setCurrentSlide(state, slideIndex) {
  state.currentSlide = slideIndex;
}
