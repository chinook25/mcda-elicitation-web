#docker run \
# --rm \
# -e LIQUIBASE_URL=jdbc:postgresql://postgres:5432/gemtc \
# -e LIQUIBASE_USERNAME=gemtc \
# -e LIQUIBASE_PASSWORD=develop \
# -e LIQUIBASE_CHANGELOG=liquibase-changelog.sql \
# -v liquibase-changelog.sql:/workspace/ \
# --link postgres:db \
# kilna/liquibase-postgres \
#  cat liquibase.properties

docker run --rm -v $(pwd):/liquibase/ \
  --network host \
  -e "LIQUIBASE_URL=jdbc:postgresql://localhost:5432/mcdaweb" \
  -e "LIQUIBASE_USERNAME=mcdaweb" \
  -e "LIQUIBASE_PASSWORD=develop" \
  -e "LIQUIBASE_CHANGELOG=liquibase-changelog.sql" \
  webdevops/liquibase:postgres \
  $@
