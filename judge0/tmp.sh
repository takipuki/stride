
for i in $(seq 1 ${1:-10}); do
(curl -s -X POST --json '{
"language_id": 71,
"source_code": "print(sum(map(int, input().split())))",
"stdin": "35 34"
}' 'http://localhost:2358/submissions?wait=true&base64_encoded=false' >/dev/null) &
done

wait
