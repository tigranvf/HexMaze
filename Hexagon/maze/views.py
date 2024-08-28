from django.shortcuts import render


# Create your views here.
def main(request):
    mode = request.GET.get('mode', None)
    theme = request.GET.get('theme', None)

    context = {"mode": mode, "theme": theme}

    return render(request, 'maze/index.html', context)


def rayMaze(request):
    return render(request, 'maze/3d.html')


def test(request):
    return render(request, 'maze/test.html')
