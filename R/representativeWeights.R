# import genWeightsQuantiles from weights.R

run_representativeWeights <- function(params) {
  return(wrapMatrix(genWeightsQuantiles(params)))
}
