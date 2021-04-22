package main

import (
	"fmt"
	"net/http"
)

func main() {
	resp, err := http.Get("https://jsonplaceholder.typicode.com/posts/1")
	if err != nil {
		fmt.Println(err)
	} else {
		fmt.Println(resp)
	}
}
