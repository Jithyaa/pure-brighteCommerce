
function addToCart(proId) {
    $.ajax({
      url: '/add-to-cart/' + proId,
      method: 'get',
      success: (response) => {
        if (response.status) {
          let count = $('#cart-count').html();
          count = parseInt(count) + 1;
          $("#cart-count").html(count);
          Swal.fire({
            title: "Item added to cart!",
            text: response.message,
            icon: "success"
          });
        } else {
          Swal.fire({
            title: "Please login!",
            text: response.message,
            icon: "error"
          });
        }
      }
    });
  }


  
function addToWishlist(proId) {
  $.ajax({
    url: '/add-to-wishlist/' + proId,
    method: 'get',
    success: (response) => {
      if (response.status) {
        let count = $('#cart-count').html();
        count = parseInt(count) + 1;
        $("#cart-count").html(count);
        Swal.fire({
          title: "Item added to wishlist!",
          text: response.message,
          icon: "success"
        });
      } else {
        Swal.fire({
          title: "Please login!",
          text: response.message,
          icon: "error"
        });
      }
    }
  });
}